"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskContext = void 0;
class TaskContext {
    constructor(tasksRepository, tasksProvider) {
        this.tasksRepository = tasksRepository;
        this.tasksProvider = tasksProvider;
    }
    refreshTasks() {
        this.tasksRepository.read();
        this.tasksProvider._onDidChangeTreeData.fire();
    }
}
exports.TaskContext = TaskContext;
//# sourceMappingURL=tasksManager.js.map