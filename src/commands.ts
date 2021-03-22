import * as vscode from "vscode";

export async function commandHandler(tasks: vscode.Task) {
    try {
        let taskNames: Array<string> = [];
        tasks.forEach(task => {
            taskNames.push(task._name)
        });
        const cmd = await vscode.window.showQuickPick(
            taskNames, { placeHolder: 'Type or select command to run' }
        );

        if (cmd) {
            vscode.window.showInformationMessage(tasks[cmd]._name);
            // vscode.tasks.executeTask(tasks[cmd]).then();
        }
    } catch (err) {
        // do nothings;
    }
};
