import * as vscode from "vscode";

import { taskHandler } from "./taskHandler";
import { LaunchProvider } from "./launchProvider";
import { modeHandler } from "./modeHandler";
import { PropertiesProvider } from "./propertiesProvider";
import { SettingsProvider } from "./settingsProvider";
import { updateBuildStatus, updateCleanStatus, updateDebugStatus, updateFolderStatus, updateModeStatus, updateRunStatus } from "./statusBarItems";
import { TaskProvider } from "./taskProvider";
import { Architectures, Builds } from "./utils";
import { workspaceHandler } from "./workspaceHandler";

const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";

let taskProviderDisposable: vscode.Disposable;
let commandHandlerDisposable: vscode.Disposable;
let commandInitDisposable: vscode.Disposable;
let commandModeDisposable: vscode.Disposable;

let settingsProvider: SettingsProvider;
let launchProvider: LaunchProvider;
let propertiesProvider: PropertiesProvider;
let taskProvider: TaskProvider;

const statusBarAlign = vscode.StatusBarAlignment.Left;
const statusBarPriority = 50;
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
  initFolderStatusBar(context);

  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    return;
  }
  workspaceFolder = undefined;

  initModeStatusBar(context);
  initBuildStatusBar(context);
  initRunStatusBar(context);
  initDebugStatusBar(context);
  cleanDebugStatusBar(context);

  commandInitDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.folder`,
    () => initCallback()
  );
  folderStatusBar.command = `${EXTENSION_NAME}.folder`;
  context.subscriptions.push(commandInitDisposable);

  commandModeDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.mode`,
    () => modeCallback()
  );
  modeStatusBar.command = `${EXTENSION_NAME}.mode`;
  context.subscriptions.push(commandModeDisposable);

  workspaceInstance(context);
}

function initFolderStatusBar(context: vscode.ExtensionContext) {
  folderStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority
  );
  context.subscriptions.push(folderStatusBar);
  updateFolderStatus(folderStatusBar, taskProvider);
}

function initModeStatusBar(context: vscode.ExtensionContext) {
  modeStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority - 1
  );
  context.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, buildMode, architectureMode);
}

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority - 2
  );
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar);
}

function initRunStatusBar(context: vscode.ExtensionContext) {
  runStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority - 3
  );
  context.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar);
}

function initDebugStatusBar(context: vscode.ExtensionContext) {
  debugStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority - 4
  );
  context.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar);
}

function cleanDebugStatusBar(context: vscode.ExtensionContext) {
  cleanStatusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority - 5
  );
  context.subscriptions.push(debugStatusBar);
  updateCleanStatus(debugStatusBar);
}

async function initCallback() {
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

function runCallback() {
  if (!workspaceFolder) {
    if (!promiseMessage) {
      promiseMessage = vscode.window.showErrorMessage(
        "You have to select a folder first."
      );
    }
  } else {
    promiseMessage = undefined;
    taskProvider.getTasks();
    taskHandler(taskProvider);
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
  deactivateProviderDisposables();

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    EXTENSION_NAME,
    taskProvider
  );
  commandHandlerDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.tasks`,
    () => runCallback()
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

function deactivateProviderDisposables() {
  if (taskProviderDisposable) {
    taskProviderDisposable.dispose();
  }
  if (commandHandlerDisposable) {
    commandHandlerDisposable.dispose();
  }
}

export function deactivate(): void {
  deactivateProviderDisposables();

  if (commandInitDisposable) {
    commandInitDisposable.dispose();
  }
  if (folderStatusBar) {
    folderStatusBar.dispose();
  }
}
