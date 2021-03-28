import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { commandHandler } from "./commands";
import { SettingsProvider } from "./settingsProvider";
import { PropertiesProvider } from "./propertiesProvider";

const EXTENSION_NAME = "C_Cpp_Runner";

export function activate(context: vscode.ExtensionContext) {
  const workspace = vscode.workspace.workspaceFolders;

  if (!workspace || workspace.length > 1) {
    return;
  }

  const settingsProvider = new SettingsProvider();

  const workspacePath = workspace[0].uri.fsPath;
  const propertiesProvider = new PropertiesProvider(
    settingsProvider,
    workspacePath
  );

  let taskProvider = new TaskProvider(settingsProvider);

  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () =>
      commandHandler(taskProvider)
    )
  );

  vscode.workspace.onDidChangeConfiguration(() => {
    taskProvider.settingsProvider.getSettings();
    taskProvider.getTasks(true);
  });
}

export function deactivate(): void {}
