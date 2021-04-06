import * as path from 'path';
import * as vscode from 'vscode';

import { PropertiesProvider } from './propertiesProvider';
import { SettingsProvider } from './settingsProvider';
import { getLanguage, readJsonFile, replaceBackslashes } from '../utils';
import {
  Builds,
  Architectures,
  Languages,
  JsonTask,
  JsonInnerTask,
  Tasks,
  JsonConfiguration,
  Task,
} from '../types';

export class TaskProvider implements vscode.TaskProvider {
  public tasks: Task[] | undefined;
  private _tasksFile: string;
  private _makefileFile: string;

  constructor(
    public settingsProvider: SettingsProvider,
    public propertiesProvider: PropertiesProvider,
    public pickedFolder: string,
    public buildMode: Builds,
    public architectureMode: Architectures,
  ) {
    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, 'src', '_templates');
    this._tasksFile = path.join(templateDirectory, 'tasks_template.json');
    this._makefileFile = path.join(templateDirectory, 'Makefile');

    if (!this.pickedFolder) {
      this.pickedFolder = this.propertiesProvider.workspaceFolder;
    }

    this.getTasks();
  }

  public async resolveTask(task: Task) {
    return task;
  }

  public provideTasks(): Task[] {
    return this.getTasks();
  }

  public getTasks(): Task[] {
    if (!this.pickedFolder) {
      this.pickedFolder = this.propertiesProvider.workspaceFolder;
    }

    const language = getLanguage(this.pickedFolder);

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
    const settings = this.settingsProvider;
    const pickedFolder = this.pickedFolder;
    const workspaceFolder = this.propertiesProvider.workspaceFolder;
    const folder = pickedFolder.replace(
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

  public getProjectFolder() {
    let projectFolder = '';

    if (this.pickedFolder) {
      projectFolder = this.pickedFolder;
    } else {
      projectFolder = this.propertiesProvider.workspaceFolder;
    }

    return projectFolder;
  }

  private addDebugTask() {
    if (!this.tasks) {
      return;
    }

    const folder = this.pickedFolder.replace(
      this.propertiesProvider.workspaceFolder,
      path.basename(this.propertiesProvider.workspaceFolder),
    );
    let label = `Debug: ${this.pickedFolder}`;
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
    const uriWorkspaceFolder = vscode.Uri.file(
      this.propertiesProvider.workspaceFolder,
    );
    const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
    const config: JsonConfiguration = readJsonFile(
      path.join(
        this.propertiesProvider.workspaceFolder,
        '.vscode',
        'launch.json',
      ),
    );
    await vscode.debug.startDebugging(folder, config.configurations[0]);
  }
}
