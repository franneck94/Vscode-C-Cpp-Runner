import * as vscode from 'vscode';

import { CustomBuildTaskProvider } from './customTaskProvider';

let customTaskProvider: CustomBuildTaskProvider | undefined;
let disposableCustomTaskProvider: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace || workspace.length > 1) {
        return;
    } 

    customTaskProvider = new CustomBuildTaskProvider();
	disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(
        'Runner.run',
        customTaskProvider
    );

    context.subscriptions.push(disposableCustomTaskProvider);
}

export function deactivate(): void {
	if (disposableCustomTaskProvider) {
		disposableCustomTaskProvider.dispose();
	}
}
