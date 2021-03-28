import * as vscode from 'vscode';

import { TaskProvider } from './taskProvider';
import { commandHandler } from './commands';
import { SettingsProvider } from './settingsProvider';
import { PropertiesProvider } from './propertiesProvider';

const extensionName: string = 'C_Cpp_Runner';

let taskProvider: TaskProvider;
let disposableCustomTaskProvider: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace || workspace.length > 1) {
        return;
    }

    const settingsProvider = new SettingsProvider();

    const workspacePath = workspace[0].uri.fsPath;
    const propertiesProvider = new PropertiesProvider(settingsProvider, workspacePath);

    taskProvider = new TaskProvider(settingsProvider);
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(
        extensionName,
        taskProvider
    );
    context.subscriptions.push(disposableCustomTaskProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${extensionName}.run`,
            () => commandHandler(taskProvider)
        )
    );

    vscode.workspace.onDidChangeConfiguration(() => {
        taskProvider.settingsProvider.getSettings();
        taskProvider.getTasks(true);
    });
}

export function deactivate(): void {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
