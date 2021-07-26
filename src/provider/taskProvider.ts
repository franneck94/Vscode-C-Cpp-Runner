import * as path from 'path';
import * as vscode from 'vscode';

import { extensionPath } from '../extension';
import {
	getLanguage,
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import {
	Builds,
	JsonConfiguration,
	JsonInnerTask,
	JsonTask,
	Languages,
	Task,
	Tasks,
} from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { SettingsProvider } from './settingsProvider';

const EXTENSION_NAME = 'C_Cpp_Runner';
const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export class TaskProvider implements vscode.TaskProvider {
  private readonly _tasksFile: string;
  private readonly _makefileFile: string;
  public tasks: Task[] | undefined;

  constructor(
    private readonly _settingsProvider: SettingsProvider,
    private _workspaceFolder: string | undefined,
    private _activeFolder: string | undefined,
    private _buildMode: Builds,
    private _argumentsString: string | undefined,
  ) {
    const templateDirectory = path.join(
      extensionPath ? extensionPath : '',
      'templates',
    );
    this._tasksFile = path.join(templateDirectory, 'tasks_template.json');
    this._makefileFile = path.join(templateDirectory, 'Makefile');

    this.getTasks();
  }

  public async resolveTask(task: Task) {
    return task;
  }

  public provideTasks() {
    return this.getTasks();
  }

  public getTasks() {
    if (!this.activeFolder) return [];

    const language = getLanguage(this.activeFolder);

    this.setTasksDefinition(language);

    if (!this.tasks) return [];

    return this.tasks;
  }

  private setTasksDefinition(language: Languages) {
    const taskType = 'shell';
    const configJson: JsonTask = readJsonFile(this._tasksFile);

    if (!configJson) {
      return [];
    }

    this.tasks = [];

    for (const taskJson of configJson.tasks) {
      if (taskJson.type !== taskType) {
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
        type: taskType,
        task: taskJson.label,
      };
      const problemMatcher = '$gcc';
      const scope = vscode.TaskScope.Workspace;
      const execution = new vscode.ShellExecution(shellCommand);
      const task = new Task(
        definition,
        scope,
        taskJson.label,
        EXTENSION_NAME,
        execution,
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
    if (!this.workspaceFolder || !this.activeFolder) return;

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
    taskJson.command = settings.makePath;
    taskJson.args[1] = `--file=${this._makefileFile}`;

    const isCleanTask = taskJson.label.includes(Tasks.clean);
    const isRunTask = taskJson.label.includes(Tasks.run);

    // Makefile arguments that hold single values
    taskJson.args.push(`COMPILATION_MODE=${this.buildMode}`);
    taskJson.args.push(`EXECUTABLE_NAME=out${this.buildMode}`);
    taskJson.args.push(`LANGUAGE_MODE=${language}`);

    if (!isCleanTask && !isRunTask) {
      if (language === Languages.c) {
        taskJson.args.push(`C_COMPILER=${settings.cCompilerPath}`);
        if (
          settings.cStandard &&
          settings.cStandard !== SettingsProvider.DEFAULT_C_STANDARD
        ) {
          taskJson.args.push(`C_STANDARD=${settings.cStandard}`);
        }
      } else {
        taskJson.args.push(`CPP_COMPILER=${settings.cppCompilerPath}`);
        if (
          settings.cppStandard &&
          settings.cppStandard !== SettingsProvider.DEFAULT_CPP_STANDARD
        ) {
          taskJson.args.push(`CPP_STANDARD=${settings.cppStandard}`);
        }
      }
      taskJson.args.push(`ENABLE_WARNINGS=${+settings.enableWarnings}`);
      taskJson.args.push(`WARNINGS_AS_ERRORS=${+settings.warningsAsError}`);

      // Makefile arguments that can hold multiple values
      if (settings.warnings && settings.warnings.length > 0) {
        const warningsStr = settings.warnings.join(' ');
        taskJson.args.push(`WARNINGS="${warningsStr}"`);
      }
      if (settings.compilerArgs && settings.compilerArgs.length > 0) {
        const compilerArgsStr = settings.compilerArgs.join(' ');
        taskJson.args.push(`COMPILER_ARGS="${compilerArgsStr}"`);
      }
      if (settings.linkerArgs && settings.linkerArgs.length > 0) {
        const linkerArgsStr = settings.linkerArgs.join(' ');
        taskJson.args.push(`LINKER_ARGS="${linkerArgsStr}"`);
      }
      if (settings.includePaths && settings.includePaths.length > 0) {
        const includePathsStr = settings.includePaths.join(' ');
        taskJson.args.push(`INCLUDE_PATHS="${includePathsStr}"`);
      }
    }

    if (isRunTask) {
      if (this.argumentsString) {
        taskJson.args.push(`ARGUMENTS=${this.argumentsString}`);
      }
    }
  }

  public updateModeData(buildMode: Builds) {
    this.buildMode = buildMode;
  }

  public updateArguments(argumentsString: string | undefined) {
    this.argumentsString = argumentsString;

    if (this.workspaceFolder) {
      const launchPath = path.join(
        this.workspaceFolder,
        '.vscode',
        'launch.json',
      );

      const configJson: JsonConfiguration | undefined = readJsonFile(
        launchPath,
      );

      if (!configJson) return;

      const configIdx = getLaunchConfigIndex(configJson, CONFIG_NAME);

      if (configIdx === undefined) return;

      if (this.argumentsString) {
        configJson.configurations[configIdx].args.push(this.argumentsString);
      } else {
        configJson.configurations[configIdx].args = [];
      }

      writeJsonFile(launchPath, configJson);
    }
  }

  public updateFolderData(
    workspaceFolder: string | undefined,
    activeFolder: string | undefined,
  ) {
    this.resetArguments();

    this.workspaceFolder = workspaceFolder;
    this.activeFolder = activeFolder;
  }

  private resetArguments() {
    if (this.workspaceFolder) {
      const launchPath = path.join(
        this.workspaceFolder,
        '.vscode',
        'launch.json',
      );

      const configJson: JsonConfiguration | undefined = readJsonFile(
        launchPath,
      );

      if (configJson) {
        const configIdx = getLaunchConfigIndex(configJson, CONFIG_NAME);

        if (configIdx === undefined) return;

        configJson.configurations[configIdx].args = [];
        writeJsonFile(launchPath, configJson);
      }
    }

    this.argumentsString = undefined;
  }

  public getProjectFolder() {
    if (this.activeFolder) {
      return this.activeFolder;
    }

    if (this.workspaceFolder) {
      return this.workspaceFolder;
    }

    return undefined;
  }

  private addDebugTask() {
    if (!this.tasks) return;
    if (!this.workspaceFolder || !this.activeFolder) return;

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
      EXTENSION_NAME,
      undefined,
      problemMatcher,
    );

    this.tasks.push(task);
  }

  public async runDebugTask() {
    if (!this._activeFolder) return;
    if (!this.workspaceFolder) return;

    const uriWorkspaceFolder = vscode.Uri.file(this.workspaceFolder);
    const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
    const launchPath = path.join(
      this.workspaceFolder,
      '.vscode',
      'launch.json',
    );

    const configJson: JsonConfiguration | undefined = readJsonFile(launchPath);

    if (!configJson) return;

    const configIdx = getLaunchConfigIndex(configJson, CONFIG_NAME);

    if (configIdx === undefined) return;

    const buildPath = path.join(this._activeFolder, 'build', this.buildMode);
    if (!pathExists(buildPath)) return;

    await vscode.debug.startDebugging(
      folder,
      configJson.configurations[configIdx],
    );
  }

  public get buildMode() {
    return this._buildMode;
  }

  public set buildMode(value: Builds) {
    this._buildMode = value;
  }

  public get activeFolder() {
    return this._activeFolder;
  }

  public set activeFolder(value: string | undefined) {
    this._activeFolder = value;
  }

  public get workspaceFolder() {
    return this._workspaceFolder;
  }

  public set workspaceFolder(value: string | undefined) {
    this._workspaceFolder = value;
  }

  public get argumentsString() {
    return this._argumentsString;
  }

  public set argumentsString(value: string | undefined) {
    this._argumentsString = value;
  }
}
