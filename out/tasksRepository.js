"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksRepository = void 0;
const fs = require("fs");
const path = require("path");
const tasks_1 = require("./tasks");
const utils_1 = require("./utils");
class TasksRepository {
    constructor() {
        this.tasks = new Array();
        this.tasksFile = path.join('./', 'tasks.json');
        if (!utils_1.pathExists(this.tasksFile)) {
            return;
        }
        this.read();
    }
    read() {
        this.tasks = [];
        if (!utils_1.pathExists(this.tasksFile)) {
            return;
        }
        let configJson;
        try {
            const fileContent = fs.readFileSync(this.tasksFile, 'utf-8');
            configJson = JSON.parse(fileContent);
        }
        catch (err) {
            return;
        }
        if (!configJson.tasks) {
            return;
        }
        for (let taskJson of configJson.tasks) {
            if (taskJson.type !== 'shell') {
                continue;
            }
            if (taskJson.options !== undefined) {
                if (taskJson.options.hide === true) {
                    continue;
                }
            }
            const task = new tasks_1.Task(taskJson.label, taskJson.args, taskJson.command, taskJson.type);
            this.tasks.push(task);
        }
        ;
    }
    getTaskByLabel(label) {
        return Array.from(this.tasks).find(task => task._label === label);
    }
}
exports.TasksRepository = TasksRepository;
//# sourceMappingURL=tasksRepository.js.map