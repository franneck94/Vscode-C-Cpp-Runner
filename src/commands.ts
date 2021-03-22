import * as vscode from "vscode";

import { TaskProvider } from './taskProvider';

export async function commandHandler(taskProvider: TaskProvider) {
    try {
        if (taskProvider.tasks === undefined) {
            throw TypeError;
        }

        let taskNames: Array<string> = [];
        taskProvider.tasks.forEach(task => {
            taskNames.push(task._name)
        });

        const pickedTaskName = await vscode.window.showQuickPick(taskNames);
        if (pickedTaskName) {
            await vscode.window.showInformationMessage(pickedTaskName);
            // for (let task in taskProvider.tasks) {
            //     if (pickedTaskName === task._name) {
            //         vscode.tasks.executeTask(task).then();
            //         break;
            //     }
            // };
        }
    } catch (err) {
        vscode.window.showInformationMessage(`Error ${err}`);
    }
};
