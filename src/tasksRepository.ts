import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { Task } from "./tasks";
import { pathExists } from './utils';

export class TasksRepository {

    public tasksFile: string;
    public tasks: Array<Task> = new Array();

    constructor(private workspaceRoot: vscode.Uri) {
        this.tasksFile = path.join(
            this.workspaceRoot.fsPath,
            '.vscode',
            'tasks.json'
        );
        if (!pathExists(this.tasksFile)) {
            return;
        }
        this.read();
    }

    read() {
        this.tasks = [];
        if (!pathExists(this.tasksFile)) {
            return;
        }

        let configJson;
        try {
            const fileContent = fs.readFileSync(this.tasksFile, 'utf-8');
            configJson = JSON.parse(fileContent);
        } catch (err) {
            return;
        }

        if (!configJson.tasks) { return; }

        for (let taskJson of configJson.tasks) {
            if (taskJson.type !== 'shell') {
                continue;
            }
            if (taskJson.options !== undefined) {
                if (taskJson.options.hide === true) {
                    continue;
                }
            }

            const task = new Task(
                taskJson.label,
                taskJson.args,
                taskJson.command,
                taskJson.type
            );
            this.tasks.push(task);
        };
    }

    getTaskByLabel(label: string): Task | undefined {
        return Array.from(this.tasks).find(
            task => task._label === label
        );
    }
}
