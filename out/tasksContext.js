"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskContext = void 0;
const vscode = require("vscode");
class TaskContext {
    constructor(tasksRepository, tasksProvider) {
        this.tasksRepository = tasksRepository;
        this.tasksProvider = tasksProvider;
        this.writeEmitter = new vscode.EventEmitter();
        this.closeEmitter = new vscode.EventEmitter();
    }
    refreshTasks() {
        this.tasksRepository.read();
        this.tasksProvider._onDidChangeTreeData.fire({});
    }
    runTask(element) {
        const shellCommand = `${element._command} ${element._args.join(' ')}`;
        const task = new vscode.Task({
            type: 'shell',
            task: element.label
        }, `running task: ${element.label}`, 'make', new vscode.ShellExecution(shellCommand));
        vscode.tasks.executeTask(task).then();
    }
}
exports.TaskContext = TaskContext;
//# sourceMappingURL=tasksContext.js.map