import * as vscode from "vscode";

import { TaskProvider } from './taskProvider';

export async function commandHandler(taskProvider: TaskProvider) {
    try {
        if (taskProvider.tasks === undefined) {
            throw TypeError;
        }

        let taskNames: Array<string> = [];
        taskProvider.tasks.forEach(task => {
            taskNames.push(task.name);
        });

        const pickedTaskName = await vscode.window.showQuickPick(taskNames);
        if (pickedTaskName) {
            taskProvider.tasks.forEach(task => {
                if (pickedTaskName === task.name) {
                    vscode.tasks.executeTask(task).then();
                }
            });
        }
    } catch (err) {
        vscode.window.showInformationMessage(err);
    }
};
