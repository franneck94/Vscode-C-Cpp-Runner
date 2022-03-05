import * as path from 'path';
import * as vscode from 'vscode';

import { extensionPath } from '../extension';
import {
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import {
	Builds,
	JsonConfiguration,
	JsonTask,
	OperatingSystems,
	Task,
} from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { SettingsProvider } from './settingsProvider';

const EXTENSION_NAME = 'C_Cpp_Runner';
const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export class TaskProvider implements vscode.TaskProvider {
  private readonly _tasksFile: string;
  public tasks: vscode.Task[] | undefined;

  constructor(
    private readonly _settingsProvider: SettingsProvider,
    private _workspaceFolder: string | undefined,
    private _activeFolder: string | undefined,
    private _buildMode: Builds,
  ) {
    const templateDirectory = path.join(
      extensionPath ? extensionPath : '',
      'templates',
    );
    this._tasksFile = path.join(templateDirectory, 'tasks_template.json');

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

    this.setTasksDefinition();

    if (!this.tasks) return [];

    return this.tasks;
  }

  private setTasksDefinition() {
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

      const shellCommand = `${taskJson.command} ${taskJson.args.join(' ')}`;

      const definition = {
        type: taskType,
        task: taskJson.label,
      };
      const scope = vscode.TaskScope.Workspace;
      let execution: vscode.ShellExecution;

      if (this._settingsProvider.operatingSystem === OperatingSystems.windows) {
        const shellOptions: vscode.ShellExecutionOptions = {
          executable: 'C:/Windows/System32/cmd.exe',
          shellArgs: ['/d', '/c'],
        };
        execution = new vscode.ShellExecution(shellCommand, shellOptions);
      } else {
        execution = new vscode.ShellExecution(shellCommand);
      }

      const task = new vscode.Task(
        definition,
        scope,
        taskJson.label,
        EXTENSION_NAME,
        execution,
      );
      this.tasks.push(task);
    }

    this.addDebugTask();

    return this.tasks;
  }

  public updateModeData(buildMode: Builds) {
    this.buildMode = buildMode;
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
    const splitted = label.split(': ');
    if (!splitted[1]) return;
    label = label.replace(splitted[1], folder);
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
}
