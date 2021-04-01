import * as vscode from 'vscode';

import { commandHandler } from './commandHandler';
import { LaunchProvider } from './launchProvider';
import { PropertiesProvider } from './propertiesProvider';
import { SettingsProvider } from './settingsProvider';
import { TaskProvider } from './taskProvider';
import { updateStatus, workspaceHandler } from './workspaceHandler';

const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";

let taskProviderDisposable: vscode.Disposable;
let commandHandlerDisposable: vscode.Disposable;
let commandInitDisposable: vscode.Disposable;
let workspacePath: string | undefined;
let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  // Status bar item
  const statusBarAlign = vscode.StatusBarAlignment.Left;
  const statusBarPriority = -1;
  statusBar = vscode.window.createStatusBarItem(
    statusBarAlign,
    statusBarPriority
  );
  context.subscriptions.push(statusBar);

  workspacePath = updateStatus(statusBar);

  // Update statusBar bar item based on events
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
    initWorkspaceCallback
  );
  statusBar.command = `${EXTENSION_NAME}.init`;
  context.subscriptions.push(commandInitDisposable);

  workspaceInstance(context);
}

async function initWorkspaceCallback() {
  workspacePath = await workspaceHandler();
  initWorkspaceInstance();
}

function updateStatusCallback() {
  const newWorkspacePath = updateStatus(statusBar);
  if (newWorkspacePath !== workspacePath) {
    workspacePath = newWorkspacePath;
    initWorkspaceInstance();
  }
}

function initWorkspaceInstance() {
  if (undefined === workspacePath) {
    return;
  }

  const settingsProvider = new SettingsProvider(workspacePath);

  const propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspacePath,
    PROPERTIES_TEMPLATE,
    PROPERTIES_FILE
  );

  const launchProvider = new LaunchProvider(
    settingsProvider,
    workspacePath,
    LAUNCH_TEMPLATE,
    LAUNCH_FILE
  );

  const taskProvider = new TaskProvider(settingsProvider, propertiesProvider);

  return { settingsProvider, propertiesProvider, launchProvider, taskProvider };
}

function workspaceInstance(context: vscode.ExtensionContext) {
  if (undefined === workspacePath) {
    return;
  }

  const providers = initWorkspaceInstance();

  if (undefined === providers) {
    return;
  }

  const settingsProvider = providers.settingsProvider;
  const propertiesProvider = providers.propertiesProvider;
  const launchProvider = providers.launchProvider;
  const taskProvider = providers.taskProvider;

  deactivateProviderDisposables();

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    EXTENSION_NAME,
    taskProvider
  );
  commandHandlerDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.run`,
    () => commandHandler(taskProvider)
  );

  context.subscriptions.push(taskProviderDisposable);
  context.subscriptions.push(commandHandlerDisposable);

  vscode.workspace.onDidChangeConfiguration(() => {
    settingsProvider.getSettings();
    taskProvider.getTasks(true);
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
  if (statusBar) {
    statusBar.dispose();
  }
}
