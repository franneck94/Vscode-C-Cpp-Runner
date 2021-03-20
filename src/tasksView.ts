import * as vscode from 'vscode';

import { TasksRepository } from './tasksRepository';
import { TasksProvider } from './tasksProvider';
import { Task } from './tasks';

export class TaskView {
    constructor(public tasksRepository: TasksRepository,
                public tasksProvider: TasksProvider) {
        let filePath = this.tasksProvider.tasksRepository.tasksFile;
        let fileWatcher = vscode.workspace.createFileSystemWatcher(filePath);
        fileWatcher.onDidChange(() => {
            this.refreshTasks();
        });
    }

    public refreshTasks(): any {
        this.tasksRepository.read();
        this.tasksProvider.refresh();
    }

    public runTask(element: Task) {
        const shellCommand = `${element._command} ${element._args.join(' ')}`;

        const task = new vscode.Task(
            {
                type: 'shell',
                task: element._label
            },
            `running task: ${element._label}`,
            'make',
            new vscode.ShellExecution(shellCommand)
        );
        vscode.tasks.executeTask(task).then();
    }
}
