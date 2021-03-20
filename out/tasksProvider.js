"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksProvider = void 0;
const vscode = require("vscode");
class TasksProvider {
    constructor(tasksRepository) {
        this.tasksRepository = tasksRepository;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getChildren(element) {
        if (element === undefined && this.tasksRepository.tasks.length > 0) {
            let tasksArray = Array.from(this.tasksRepository.tasks);
            tasksArray.forEach(task => {
                task.collapsibleState = vscode.TreeItemCollapsibleState.None;
            });
            return tasksArray;
        }
        else {
            return Promise.resolve([]);
        }
    }
    getTreeItem(element) {
        return element;
    }
}
exports.TasksProvider = TasksProvider;
//# sourceMappingURL=tasksProvider.js.map