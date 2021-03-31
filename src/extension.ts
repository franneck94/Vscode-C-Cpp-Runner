import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { commandHandler } from "./commands";
import { SettingsProvider } from "./settingsProvider";
import { PropertiesProvider } from "./propertiesProvider";
import { LaunchProvider } from "./launchProvider";
import { workspaceHandler } from "./workspaceHandler";

const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";

let taskProviderDisposable: vscode.Disposable;
let commandHandlerDisposable: vscode.Disposable;

export async function activate(context: vscode.ExtensionContext) {
  let workspacePath = await workspaceHandler();

  context.subscriptions.push(
    vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, async () =>
      workspaceInstance(await workspaceHandler(), context)
    )
  );

  workspaceInstance(workspacePath, context);
}

function workspaceInstance(
  workspacePath: string | undefined,
  context: vscode.ExtensionContext
) {
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

  let taskProvider = new TaskProvider(settingsProvider, propertiesProvider);

  let launchProvider = new LaunchProvider(
    settingsProvider,
    workspacePath,
    LAUNCH_TEMPLATE,
    LAUNCH_FILE
  );

  deactivateDisposables();

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

function deactivateDisposables() {
  if (taskProviderDisposable) {
    taskProviderDisposable.dispose();
  }
  if (commandHandlerDisposable) {
    commandHandlerDisposable.dispose();
  }
}

export function deactivate(): void {
  deactivateDisposables();
}
