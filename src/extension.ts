import * as vscode from "vscode";

import { taskHandler } from "./taskHandler";
import { LaunchProvider } from "./launchProvider";
import { modeHandler } from "./modeHandler";
import { PropertiesProvider } from "./propertiesProvider";
import { SettingsProvider } from "./settingsProvider";
import { updateFolderStatus, updateModeStatus } from "./statusBarItems";
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

let workspacePath: string | undefined;
let folderStatusBar: vscode.StatusBarItem;
let modeStatusBar: vscode.StatusBarItem;
let buildMode: Builds = Builds.debug;
let architectureMode: Architectures = Architectures.x64;

export function activate(context: vscode.ExtensionContext) {
  // Folder status bar item
  const folderStatusBarAlign = vscode.StatusBarAlignment.Left;
  const folderStatusBarPriority = 2;
  folderStatusBar = vscode.window.createStatusBarItem(
    folderStatusBarAlign,
    folderStatusBarPriority
  );
  context.subscriptions.push(folderStatusBar);
  workspacePath = updateFolderStatus(folderStatusBar);

  // Mode status bar item
  const modeStatusBarAlign = vscode.StatusBarAlignment.Left;
  const modeStatusBarPriority = 1;
  modeStatusBar = vscode.window.createStatusBarItem(
    modeStatusBarAlign,
    modeStatusBarPriority
  );
  context.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, buildMode, architectureMode);

  // Update folder status bar item based on events
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders((e) => updateStatusCallback())
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((e) => updateStatusCallback())
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorViewColumn((e) => updateStatusCallback())
  );
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((e) => updateStatusCallback())
  );
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((e) => updateStatusCallback())
  );

  commandInitDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.init`,
    async () => {
      workspacePath = await workspaceHandler();
      initWorkspaceInstance();
    }
  );
  folderStatusBar.command = `${EXTENSION_NAME}.init`;
  context.subscriptions.push(commandInitDisposable);

  commandModeDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.mode`,
    async () => {
      const ret = await modeHandler(settingsProvider);
      if (undefined !== ret) {
        buildMode = ret.pickedMode;
        architectureMode = ret.pickedArchitecture;
        taskProvider.buildMode = buildMode;
        taskProvider.architectureMode = architectureMode;
        updateModeStatus(modeStatusBar, buildMode, architectureMode);
      }
    }
  );
  modeStatusBar.command = `${EXTENSION_NAME}.mode`;
  context.subscriptions.push(commandModeDisposable);

  workspaceInstance(context);
}

function updateStatusCallback() {
  const newWorkspacePath = updateFolderStatus(folderStatusBar);
  if (newWorkspacePath !== workspacePath) {
    workspacePath = newWorkspacePath;
    initWorkspaceInstance();
  }
}

function initWorkspaceInstance() {
  if (undefined === workspacePath) {
    return;
  }

  settingsProvider = new SettingsProvider(workspacePath);

  propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspacePath,
    PROPERTIES_TEMPLATE,
    PROPERTIES_FILE
  );

  launchProvider = new LaunchProvider(
    settingsProvider,
    workspacePath,
    LAUNCH_TEMPLATE,
    LAUNCH_FILE
  );

  taskProvider = new TaskProvider(
    settingsProvider,
    propertiesProvider,
    buildMode,
    architectureMode
  );
}

function workspaceInstance(context: vscode.ExtensionContext) {
  if (undefined === workspacePath) {
    return;
  }

  initWorkspaceInstance();
  deactivateProviderDisposables();

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    EXTENSION_NAME,
    taskProvider
  );
  commandHandlerDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.run`,
    () => {
      taskProvider.getTasks();
      taskHandler(taskProvider);
    }
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
