import * as path from 'path';
import * as vscode from 'vscode';

import {
  Architectures,
  Builds,
  JsonConfiguration,
  JsonInnerTask,
  JsonTask,
  Languages,
  Task,
  Tasks,
} from '../utils/types';
import {
  getLanguage,
  readJsonFile,
  replaceBackslashes,
} from '../utils/fileUtils';
import { SettingsProvider } from './settingsProvider';

export class TaskProvider implements vscode.TaskProvider {
  private readonly _tasksFile: string;
  private readonly _makefileFile: string;
  public tasks: Task[] | undefined;

  constructor(
    private readonly _settingsProvider: SettingsProvider,
    private _workspaceFolder: string,
    private _pickedFolder: string,
    private _buildMode: Builds,
    private _architectureMode: Architectures,
  ) {
    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, 'src', '_templates');
    this._tasksFile = path.join(templateDirectory, 'tasks_template.json');
    this._makefileFile = path.join(templateDirectory, 'Makefile');

    this.getTasks();
  }

  public async resolveTask(task: Task) {
    return task;
  }

  public provideTasks(): Task[] {
    return this.getTasks();
  }

  public getTasks(): Task[] {
    const language = getLanguage(this.activeFolder);

    this.setTasksDefinition(language);

    if (!this.tasks) {
      return [];
    }

    return this.tasks;
  }

  private setTasksDefinition(language: Languages) {
    const configJson: JsonTask = readJsonFile(this._tasksFile);

    if (!configJson) {
      return [];
    }

    this.tasks = [];

    for (const taskJson of configJson.tasks) {
      if (taskJson.type !== 'shell') {
        continue;
      }
      if (taskJson.options) {
        if (taskJson.options.hide) {
          continue;
        }
      }

      this.updateTaskBasedOnSettings(taskJson, language);

      const shellCommand = `${taskJson.command} ${taskJson.args.join(' ')}`;

      const definition = {
        type: 'shell',
        task: taskJson.label,
      };
      const problemMatcher = '$gcc';
      const scope = vscode.TaskScope.Workspace;
      const task = new Task(
        definition,
        scope,
        taskJson.label,
        'C_Cpp_Runner',
        new vscode.ShellExecution(shellCommand),
        problemMatcher,
      );
      this.tasks.push(task);
    }

    this.addDebugTask();

    return this.tasks;
  }

  private updateTaskBasedOnSettings(
    taskJson: JsonInnerTask,
    language: Languages,
  ) {
    const settings = this._settingsProvider;
    const activeFolder = this.activeFolder;
    const workspaceFolder = this.workspaceFolder;
    const folder = activeFolder.replace(
      workspaceFolder,
      path.basename(workspaceFolder),
    );
    taskJson.label = taskJson.label.replace(
      taskJson.label.split(': ')[1],
      folder,
    );
    taskJson.label = replaceBackslashes(taskJson.label);
    taskJson.args[1] = `--file=${this._makefileFile}`;
    taskJson.args.push(`COMPILATION_MODE=${this.buildMode}`);
    taskJson.args.push(`EXECUTABLE_NAME=out${this.buildMode}`);
    taskJson.args.push(`LANGUAGE_MODE=${language}`);
    const cleanTask = taskJson.label.includes(Tasks.clean);
    const runTask = taskJson.label.includes(Tasks.run);
    if (!cleanTask && !runTask) {
      taskJson.args.push(`ENABLE_WARNINGS=${+settings.enableWarnings}`);
      taskJson.args.push(`WARNINGS='${settings.warnings}'`);
      taskJson.args.push(`WARNINGS_AS_ERRORS=${+settings.warningsAsError}`);
      if (language === Languages.c) {
        taskJson.args.push(`C_COMPILER=${settings.compilerPathC}`);
        taskJson.args.push(`C_STANDARD=${settings.standardC}`);
      } else {
        taskJson.args.push(`CPP_COMPILER=${settings.compilerPathCpp}`);
        taskJson.args.push(`CPP_STANDARD=${settings.standardCpp}`);
      }
      if (settings.compilerArgs) {
        taskJson.args.push(`COMPILER_ARGS=${settings.compilerArgs}`);
      }
      if (settings.linkerArgs) {
        taskJson.args.push(`LINKER_ARGS=${settings.linkerArgs}`);
      }
      if (settings.includePaths) {
        taskJson.args.push(`INCLUDE_PATHS=${settings.includePaths}`);
      }
      const architectureStr =
        this.architectureMode === Architectures.x64 ? '64' : '32';
      taskJson.args.push(`ARCHITECTURE=${architectureStr}`);
    }
    taskJson.command = settings.makePath;
  }

  public updateModeData(buildMode: Builds, architectureMode: Architectures) {
    this.buildMode = buildMode;
    this.architectureMode = architectureMode;
  }

  public updatFolderData(workspaceFolder: string, activeFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this.activeFolder = activeFolder;
  }

  public getProjectFolder() {
    let projectFolder = '';

    if (this.activeFolder) {
      projectFolder = this.activeFolder;
    } else {
      projectFolder = this.workspaceFolder;
    }

    return projectFolder;
  }

  private addDebugTask() {
    if (!this.tasks) {
      return;
    }

    const folder = this.activeFolder.replace(
      this.workspaceFolder,
      path.basename(this.workspaceFolder),
    );
    let label = `Debug: ${this.activeFolder}`;
    label = label.replace(label.split(': ')[1], folder);
    label = replaceBackslashes(label);
    const definition = {
      type: 'shell',
      task: label,
    };
    const problemMatcher = '$gcc';
    const scope = vscode.TaskScope.Workspace;

    const task = new Task(
      definition,
      scope,
      label,
      'C_Cpp_Runner',
      undefined,
      problemMatcher,
    );

    this.tasks.push(task);
  }

  public async runDebugTask() {
    const uriWorkspaceFolder = vscode.Uri.file(this.workspaceFolder);
    const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
    const config: JsonConfiguration = readJsonFile(
      path.join(this.workspaceFolder, '.vscode', 'launch.json'),
    );
    await vscode.debug.startDebugging(folder, config.configurations[0]);
  }

  public get architectureMode(): Architectures {
    return this._architectureMode;
  }
  public set architectureMode(value: Architectures) {
    this._architectureMode = value;
  }
  public get buildMode(): Builds {
    return this._buildMode;
  }
  public set buildMode(value: Builds) {
    this._buildMode = value;
  }
  public get activeFolder(): string {
    return this._pickedFolder;
  }
  public set activeFolder(value: string) {
    this._pickedFolder = value;
  }
  public get workspaceFolder(): string {
    return this._workspaceFolder;
  }
  public set workspaceFolder(value: string) {
    this._workspaceFolder = value;
  }
}
