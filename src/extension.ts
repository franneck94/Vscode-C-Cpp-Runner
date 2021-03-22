import * as vscode from 'vscode';

import { TaskProvider } from './taskProvider';
import { commandHandler } from './commands';
import { SettingsProvider } from './settings';

let taskProvider: TaskProvider;
let disposableCustomTaskProvider: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace || workspace.length > 1) {
        return;
    }

    const extensionName: string = 'C_Cpp_Runner';
    const settingsProvider = new SettingsProvider();

    taskProvider = new TaskProvider(settingsProvider);
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(
        extensionName,
        taskProvider
    );
    context.subscriptions.push(disposableCustomTaskProvider);

    // context.subscriptions.push(
    //     vscode.commands.registerCommand(
    //         `${extensionName}.run`,
    //         commandHandler(taskProvider)
    //     )
    // );
}

export function deactivate(): void {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
