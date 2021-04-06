import * as vscode from 'vscode';

import { taskHandler } from './handler/taskHandler';
import { folderHandler } from './handler/folderHandler';
import { modeHandler } from './handler/modeHandler';
import { LaunchProvider } from './provider/launchProvider';
import { PropertiesProvider } from './provider/propertiesProvider';
import { SettingsProvider } from './provider/settingsProvider';
import { TaskProvider } from './provider/taskProvider';
import {
  updateBuildStatus,
  updateCleanStatus,
  updateDebugStatus,
  updateFolderStatus,
  updateModeStatus,
  updateRunStatus,
} from './items/statusBarItems';
import { Architectures, Builds, disposeItem, Tasks } from './utils';

const PROPERTIES_TEMPLATE = 'properties_template.json';
const PROPERTIES_FILE = 'c_cpp_properties.json';
const LAUNCH_TEMPLATE = 'launch_template.json';
const LAUNCH_FILE = 'launch.json';
const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;

let taskProviderDisposable: vscode.Disposable;
let commandHandlerDisposable: vscode.Disposable;
let commandFolderDisposable: vscode.Disposable;
let commandModeDisposable: vscode.Disposable;
let commandBuildDisposable: vscode.Disposable;
let commandRunDisposable: vscode.Disposable;
let commandDebugDisposable: vscode.Disposable;
let commandCleanDisposable: vscode.Disposable;

let settingsProvider: SettingsProvider;
let launchProvider: LaunchProvider;
let propertiesProvider: PropertiesProvider;
let taskProvider: TaskProvider;

let folderStatusBar: vscode.StatusBarItem;
let modeStatusBar: vscode.StatusBarItem;
let buildStatusBar: vscode.StatusBarItem;
let runStatusBar: vscode.StatusBarItem;
let debugStatusBar: vscode.StatusBarItem;
let cleanStatusBar: vscode.StatusBarItem;

let workspaceFolder: string | undefined;
let pickedFolder: string | undefined;
let buildMode: Builds = Builds.debug;
let architectureMode: Architectures = Architectures.x64;
let promiseMessage: Thenable<string | undefined> | undefined;

export function activate(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    return;
  }

  initFolderStatusBar(context);
  initModeStatusBar(context);
  initBuildStatusBar(context);
  initRunStatusBar(context);
  initDebugStatusBar(context);
  initCleanStatusBar(context);

  workspaceInstance(context);
}

export function deactivate() {
  disposeProviderDisposables();
  disposeStatusBarItems();
  disposeCommands();
}

function initWorkspaceInstance() {
  if (!workspaceFolder) {
    return;
  }

  settingsProvider = new SettingsProvider(workspaceFolder);

  propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspaceFolder,
    PROPERTIES_TEMPLATE,
    PROPERTIES_FILE,
  );

  if (!pickedFolder) {
    return;
  }

  launchProvider = new LaunchProvider(
    settingsProvider,
    workspaceFolder,
    pickedFolder,
    LAUNCH_TEMPLATE,
    LAUNCH_FILE,
  );

  taskProvider = new TaskProvider(
    settingsProvider,
    propertiesProvider,
    pickedFolder,
    buildMode,
    architectureMode,
  );
}

function workspaceInstance(context: vscode.ExtensionContext) {
  initWorkspaceInstance();
  disposeProviderDisposables();

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    'C_Cpp_Runner',
    taskProvider,
  );
  commandHandlerDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.tasks',
    () => tasksCallback(),
  );

  context.subscriptions.push(taskProviderDisposable);
  context.subscriptions.push(commandHandlerDisposable);

  vscode.workspace.onDidChangeConfiguration(() => {
    settingsProvider.getSettings();
    taskProvider.getTasks();
    propertiesProvider.updateFileData();
    launchProvider.updateFileData();
  });
}

function disposeProviderDisposables() {
  disposeItem(taskProviderDisposable);
  disposeItem(commandHandlerDisposable);
}

function disposeStatusBarItems() {
  disposeItem(folderStatusBar);
  disposeItem(modeStatusBar);
  disposeItem(buildStatusBar);
  disposeItem(runStatusBar);
  disposeItem(debugStatusBar);
  disposeItem(cleanStatusBar);
}

function disposeCommands() {
  disposeItem(commandFolderDisposable);
  disposeItem(commandModeDisposable);
  disposeItem(commandBuildDisposable);
  disposeItem(commandRunDisposable);
  disposeItem(commandDebugDisposable);
  disposeItem(commandCleanDisposable);
}

/**
INIT STATUS BAR
*/

function initFolderStatusBar(context: vscode.ExtensionContext) {
  folderStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(folderStatusBar);
  updateFolderStatus(folderStatusBar, taskProvider);

  commandFolderDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.init',
    () => folderCallback(),
  );
  folderStatusBar.command = 'C_Cpp_Runner.init';
  context.subscriptions.push(commandFolderDisposable);
}

function initModeStatusBar(context: vscode.ExtensionContext) {
  modeStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, buildMode, architectureMode);

  commandModeDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.mode',
    () => modeCallback(),
  );
  modeStatusBar.command = 'C_Cpp_Runner.mode';
  context.subscriptions.push(commandModeDisposable);
}

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar);

  commandBuildDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.build',
    () => buildCallback(),
  );
  buildStatusBar.command = 'C_Cpp_Runner.build';
  context.subscriptions.push(commandBuildDisposable);
}

function initRunStatusBar(context: vscode.ExtensionContext) {
  runStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar);

  commandRunDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.run',
    () => runCallback(),
  );
  runStatusBar.command = 'C_Cpp_Runner.run';
  context.subscriptions.push(commandRunDisposable);
}

function initDebugStatusBar(context: vscode.ExtensionContext) {
  debugStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar);

  commandDebugDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.debug',
    () => debugCallback(),
  );
  debugStatusBar.command = 'C_Cpp_Runner.debug';
  context.subscriptions.push(commandDebugDisposable);
}

function initCleanStatusBar(context: vscode.ExtensionContext) {
  cleanStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
  context.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar);

  commandCleanDisposable = vscode.commands.registerCommand(
    'C_Cpp_Runner.clean',
    () => cleanCallback(),
  );
  cleanStatusBar.command = 'C_Cpp_Runner.clean';
  context.subscriptions.push(commandCleanDisposable);
}

/**
STATUS BAR CALLBACKS
*/

async function folderCallback() {
  const ret = await folderHandler();
  if (ret && ret.pickedFolder && ret.workspaceFolder) {
    pickedFolder = ret.pickedFolder;
    workspaceFolder = ret.workspaceFolder;

    initWorkspaceInstance();

    if (workspaceFolder && pickedFolder) {
      if (propertiesProvider) {
        propertiesProvider.workspaceFolder = workspaceFolder;
      }
      if (taskProvider) {
        taskProvider.pickedFolder = pickedFolder;
        if (buildMode && architectureMode) {
          taskProvider.buildMode = buildMode;
          taskProvider.architectureMode = architectureMode;
        }
      }
      if (launchProvider) {
        launchProvider.pickedFolder = pickedFolder;
        launchProvider.workspaceFolder = workspaceFolder;
        launchProvider.updateFileData();
      }
    }
    updateFolderStatus(folderStatusBar, taskProvider);
  }
}

async function modeCallback() {
  const ret = await modeHandler(settingsProvider);
  if (ret && ret.pickedArchitecture && ret.pickedMode) {
    buildMode = ret.pickedMode;
    architectureMode = ret.pickedArchitecture;
    if (taskProvider) {
      taskProvider.buildMode = buildMode;
      taskProvider.architectureMode = architectureMode;
    }
    updateModeStatus(modeStatusBar, buildMode, architectureMode);
  }
}

function buildCallback() {
  if (!taskProvider || !taskProvider.tasks) {
    return;
  }

  taskProvider.getTasks();

  const projectFolder = taskProvider.getProjectFolder();
  taskProvider.tasks.forEach(async (task) => {
    if (task.name.includes(Tasks.build)) {
      if (
        task.execution &&
        task.execution instanceof vscode.ShellExecution &&
        task.execution.commandLine
      ) {
        task.execution.commandLine = task.execution.commandLine.replace(
          'FILE_DIR',
          projectFolder,
        );
      }
      await vscode.tasks.executeTask(task);
    }
  });
}

function runCallback() {
  if (!taskProvider || !taskProvider.tasks) {
    return;
  }

  taskProvider.getTasks();

  const projectFolder = taskProvider.getProjectFolder();
  taskProvider.tasks.forEach(async (task) => {
    if (task.name.includes(Tasks.run)) {
      if (
        task.execution &&
        task.execution instanceof vscode.ShellExecution &&
        task.execution.commandLine
      ) {
        task.execution.commandLine = task.execution.commandLine.replace(
          'FILE_DIR',
          projectFolder,
        );
      }
      await vscode.tasks.executeTask(task);
    }
  });
}

async function debugCallback() {
  if (!pickedFolder || !workspaceFolder) {
    return;
  }

  taskProvider.runDebugTask();
}

function cleanCallback() {
  if (!taskProvider || !taskProvider.tasks) {
    return;
  }

  taskProvider.getTasks();

  const projectFolder = taskProvider.getProjectFolder();
  taskProvider.tasks.forEach(async (task) => {
    if (task.name.includes(Tasks.clean)) {
      if (
        task.execution &&
        task.execution instanceof vscode.ShellExecution &&
        task.execution.commandLine
      ) {
        task.execution.commandLine = task.execution.commandLine.replace(
          'FILE_DIR',
          projectFolder,
        );
      }
      await vscode.tasks.executeTask(task);
    }
  });
}

function tasksCallback() {
  if (!workspaceFolder) {
    if (!promiseMessage) {
      promiseMessage = vscode.window.showErrorMessage(
        'You have to select a folder first.',
      );
    }
  } else {
    promiseMessage = undefined;

    if (taskProvider) {
      taskProvider.getTasks();
      taskHandler(taskProvider);
    }
  }
}
