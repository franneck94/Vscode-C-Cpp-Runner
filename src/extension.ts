import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { commandHandler } from "./commands";
import { SettingsProvider } from "./settingsProvider";
import { PropertiesProvider } from "./propertiesProvider";
import { LaunchProvider } from "./launchProvider";

const EXTENSION_NAME = "C_Cpp_Runner";

export function activate(context: vscode.ExtensionContext) {
  const workspace = vscode.workspace.workspaceFolders;

  if (!workspace || workspace.length !== 1) {
    return;
  }

  const workspacePath = workspace[0].uri.fsPath;

  const settingsProvider = new SettingsProvider(workspacePath);

  const propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspacePath
  );

  let taskProvider = new TaskProvider(settingsProvider, propertiesProvider);

  let launchProvider = new LaunchProvider(settingsProvider, workspacePath);

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
    propertiesProvider.updateProperties();
    launchProvider.updateDebugConfig();
  });
}

export function deactivate(): void {}
