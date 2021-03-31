import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { commandHandler } from "./commands";
import { SettingsProvider } from "./settingsProvider";
import { PropertiesProvider } from "./propertiesProvider";
import { LaunchProvider } from "./launchProvider";

const EXTENSION_NAME = "C_Cpp_Runner";

export function activate(context: vscode.ExtensionContext) {
  const workspace = vscode.workspace.workspaceFolders;

  if (!workspace || 1 !== workspace.length) {
    return;
  }

  const workspacePath = workspace[0].uri.fsPath;

  const settingsProvider = new SettingsProvider(workspacePath);

  const propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspacePath,
    "properties_template.json",
    "c_cpp_properties.json"
  );

  let taskProvider = new TaskProvider(settingsProvider, propertiesProvider);

  let launchProvider = new LaunchProvider(
    settingsProvider,
    workspacePath,
    "launch_template.json",
    "launch.json"
  );

  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () =>
      commandHandler(taskProvider)
    )
  );

  vscode.workspace.onDidChangeConfiguration(() => {
    settingsProvider.getSettings();
    taskProvider.getTasks(true);
    propertiesProvider.updateFileData();
    launchProvider.updateFileData();
  });
}

export function deactivate(): void {}
