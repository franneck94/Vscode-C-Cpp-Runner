import * as vscode from 'vscode';

import { CppBuildTaskProvider } from './customTaskProvider';
import { commandHandler } from './commands';

let customTaskProvider: CppBuildTaskProvider | undefined;
let disposableCustomTaskProvider: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace || workspace.length > 1) {
        return;
    }

    const extensionName: string = 'C_Cpp_Runner';

    customTaskProvider = new CppBuildTaskProvider();
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(
        extensionName,
        customTaskProvider
    );

    context.subscriptions.push(disposableCustomTaskProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand(
            `${extensionName}.run`,
            (customTaskProvider.tasks) => commandHandler(customTaskProvider.tasks)
        )
    );
}

export function deactivate(): void {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
