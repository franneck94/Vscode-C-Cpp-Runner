import * as vscode from "vscode";

import { taskHandler } from "./taskHandler";
import { LaunchProvider } from "./launchProvider";
import { modeHandler } from "./modeHandler";
import { PropertiesProvider } from "./propertiesProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  updateBuildStatus,
  updateCleanStatus,
  updateDebugStatus,
  updateFolderStatus,
  updateModeStatus,
  updateRunStatus,
} from "./statusBarItems";
import { TaskProvider } from "./taskProvider";
import { Architectures, Builds, Tasks } from "./utils";
import { workspaceHandler } from "./workspaceHandler";

const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";
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

function initFolderStatusBar(context: vscode.ExtensionContext) {
  folderStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY
  );
  context.subscriptions.push(folderStatusBar);
  updateFolderStatus(folderStatusBar, taskProvider);

  commandFolderDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.init`,
    () => folderCallback()
  );
  folderStatusBar.command = `${EXTENSION_NAME}.init`;
  context.subscriptions.push(commandFolderDisposable);
}

function initModeStatusBar(context: vscode.ExtensionContext) {
  modeStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY - 1
  );
  context.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, buildMode, architectureMode);

  commandModeDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.mode`,
    () => modeCallback()
  );
  modeStatusBar.command = `${EXTENSION_NAME}.mode`;
  context.subscriptions.push(commandModeDisposable);
}

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY - 2
  );
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar);

  commandBuildDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.build`,
    () => buildCallback()
  );
  buildStatusBar.command = `${EXTENSION_NAME}.build`;
  context.subscriptions.push(commandBuildDisposable);
}

function initRunStatusBar(context: vscode.ExtensionContext) {
  runStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY - 3
  );
  context.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar);

  commandRunDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.run`,
    () => runCallback()
  );
  runStatusBar.command = `${EXTENSION_NAME}.run`;
  context.subscriptions.push(commandRunDisposable);
}

function initDebugStatusBar(context: vscode.ExtensionContext) {
  debugStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY - 4
  );
  context.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar);

  commandDebugDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.debug`,
    () => debugCallback()
  );
  debugStatusBar.command = `${EXTENSION_NAME}.debug`;
  context.subscriptions.push(commandDebugDisposable);
}

function initCleanStatusBar(context: vscode.ExtensionContext) {
  cleanStatusBar = vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY - 5
  );
  context.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar);

  commandCleanDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.clean`,
    () => cleanCallback()
  );
  cleanStatusBar.command = `${EXTENSION_NAME}.clean`;
  context.subscriptions.push(commandCleanDisposable);
}

async function folderCallback() {
  const ret = await workspaceHandler();
  if (ret && ret.pickedFolder && ret.workspaceFolder) {
    pickedFolder = ret.pickedFolder;
    workspaceFolder = ret.workspaceFolder;

    initWorkspaceInstance();
    if (propertiesProvider && workspaceFolder && pickedFolder) {
      propertiesProvider.workspaceFolder = workspaceFolder;
    }
    taskProvider.pickedFolder = pickedFolder;
    if (buildMode && architectureMode) {
      taskProvider.buildMode = buildMode;
      taskProvider.architectureMode = architectureMode;
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
          "FILE_DIR",
          projectFolder
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
          "FILE_DIR",
          projectFolder
        );
      }
      await vscode.tasks.executeTask(task);
    }
  });
}

function debugCallback() {
  vscode.window.showInformationMessage("You pressed debug!");
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
          "FILE_DIR",
          projectFolder
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
        "You have to select a folder first."
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

function initWorkspaceInstance() {
  if (!workspaceFolder) {
    return;
  }

  settingsProvider = new SettingsProvider(workspaceFolder);

  propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspaceFolder,
    PROPERTIES_TEMPLATE,
    PROPERTIES_FILE
  );

  launchProvider = new LaunchProvider(
    settingsProvider,
    workspaceFolder,
    LAUNCH_TEMPLATE,
    LAUNCH_FILE
  );

  if (!pickedFolder) {
    return;
  }

  taskProvider = new TaskProvider(
    settingsProvider,
    propertiesProvider,
    pickedFolder,
    buildMode,
    architectureMode
  );
}

function workspaceInstance(context: vscode.ExtensionContext) {
  initWorkspaceInstance();
  disposeProviderDisposables();

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    EXTENSION_NAME,
    taskProvider
  );
  commandHandlerDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.tasks`,
    () => tasksCallback()
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
  if (taskProviderDisposable) {
    taskProviderDisposable.dispose();
  }
  if (commandHandlerDisposable) {
    commandHandlerDisposable.dispose();
  }
}

function disposeStatusBarItems() {
  if (folderStatusBar) {
    folderStatusBar.dispose();
  }
  if (modeStatusBar) {
    modeStatusBar.dispose();
  }
  if (buildStatusBar) {
    buildStatusBar.dispose();
  }
  if (runStatusBar) {
    runStatusBar.dispose();
  }
  if (debugStatusBar) {
    debugStatusBar.dispose();
  }
  if (cleanStatusBar) {
    cleanStatusBar.dispose();
  }
}

function disposeCommands() {
  if (commandFolderDisposable) {
    commandFolderDisposable.dispose();
  }
}

export function deactivate() {
  disposeProviderDisposables();
  disposeStatusBarItems();
  disposeCommands();
}
