import * as vscode from 'vscode';

import { TasksRepository } from './tasksRepository';

export class TasksProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    constructor(public tasksRepository: TasksRepository) {
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if (element === undefined && this.tasksRepository.tasks.length > 0) {
            let tasksArray =  Array.from(this.tasksRepository.tasks);
            tasksArray.forEach(task => {
                task.collapsibleState = vscode.TreeItemCollapsibleState.None;
            });

            return tasksArray;
        }
        else {
            return Promise.resolve([]);
        }
    }

    public getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
}
