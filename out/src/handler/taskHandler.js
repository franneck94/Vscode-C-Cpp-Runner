"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskHandler = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
async function taskHandler(taskProvider) {
    let provideRunTask = false;
    let provideCleanTask = false;
    let provideDebugTask = false;
    if (!taskProvider.tasks) {
        return;
    }
    const tasks = taskProvider.tasks;
    const projectFolder = taskProvider.getProjectFolder();
    const buildFolder = path.join(projectFolder, 'build');
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
    const pickedTaskName = await vscode.window.showQuickPick(taskNames);
    if (pickedTaskName) {
        tasks.forEach(async (task) => {
            if (pickedTaskName === task.name) {
                if (task.name.includes('Debug')) {
                    taskProvider.runDebugTask();
                }
                else if (task.execution &&
                    task.execution instanceof vscode.ShellExecution &&
                    task.execution.commandLine) {
                    task.execution.commandLine = task.execution.commandLine.replace('FILE_DIR', projectFolder);
                }
                await vscode.tasks.executeTask(task);
            }
        });
    }
}
exports.taskHandler = taskHandler;
//# sourceMappingURL=taskHandler.js.map