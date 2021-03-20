"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksProvider = void 0;
const vscode = require("vscode");
class TasksProvider {
    constructor(_tasksRepository) {
        this._tasksRepository = _tasksRepository;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    getChildren(element) {
        if (this._tasksRepository.tasks.size > 0) {
            return Array.from(this._tasksRepository.tasks);
        }
        else {
            vscode.window.showInformationMessage('Workspace has no package.json');
            return Promise.resolve([]);
        }
    }
    getTreeItem(element) {
        return element;
    }
}
exports.TasksProvider = TasksProvider;
//# sourceMappingURL=tasksTreeViewProvider.js.map