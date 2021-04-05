"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskHandler = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
function taskHandler(taskProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        let provideRunTask = false;
        let provideCleanTask = false;
        let provideDebugTask = false;
        if (!taskProvider.tasks) {
            return;
        }
        const tasks = taskProvider.tasks;
        const projectFolder = taskProvider.getProjectFolder();
        const buildFolder = path.join(projectFolder, "build");
        const debugFolder = path.join(buildFolder, utils_1.Builds.debug);
        const releaseFolder = path.join(buildFolder, utils_1.Builds.release);
        const currentMode = taskProvider.buildMode;
        if (currentMode === utils_1.Builds.debug && utils_1.pathExists(debugFolder)) {
            provideRunTask = true;
            provideCleanTask = true;
        }
        else if (currentMode === utils_1.Builds.release && utils_1.pathExists(releaseFolder)) {
            provideRunTask = true;
            provideCleanTask = true;
        }
        if (utils_1.pathExists(debugFolder)) {
            provideDebugTask = true;
        }
        let taskNames = [];
        tasks.forEach((task) => {
            taskNames.push(task.name);
        });
        if (!provideRunTask) {
            taskNames = utils_1.filterOnString(taskNames, utils_1.Tasks.run);
        }
        if (!provideCleanTask) {
            taskNames = utils_1.filterOnString(taskNames, utils_1.Tasks.clean);
        }
        if (!provideDebugTask) {
            taskNames = utils_1.filterOnString(taskNames, utils_1.Tasks.debug);
        }
        const pickedTaskName = yield vscode.window.showQuickPick(taskNames);
        if (pickedTaskName) {
            tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
                if (pickedTaskName === task.name) {
                    if (task.name.includes("Debug")) {
                        taskProvider.runDebugTask();
                    }
                    else if (task.execution &&
                        task.execution instanceof vscode.ShellExecution &&
                        task.execution.commandLine) {
                        task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", projectFolder);
                    }
                    yield vscode.tasks.executeTask(task);
                }
            }));
        }
    });
}
exports.taskHandler = taskHandler;
//# sourceMappingURL=taskHandler.js.map