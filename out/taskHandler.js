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
        try {
            let provideBuildFolderTasks = false;
            const editor = vscode.window.activeTextEditor;
            if (undefined === editor || undefined === taskProvider.tasks) {
                throw TypeError("No tasks provided.");
            }
            const tasks = taskProvider.tasks;
            let projectFolder = "";
            if (taskProvider.pickedFolder !== undefined) {
                projectFolder = taskProvider.pickedFolder;
            }
            else {
                projectFolder = taskProvider.propertiesProvider.workspacePath;
            }
            const buildFolder = path.join(projectFolder, "build");
            if (utils_1.pathExists(buildFolder)) {
                provideBuildFolderTasks = true;
            }
            let taskNames = [];
            tasks.forEach((task) => {
                taskNames.push(task.name);
            });
            if (!provideBuildFolderTasks) {
                taskNames = taskNames.filter((name) => !(name.includes(utils_1.Tasks.run) || name.includes(utils_1.Tasks.clean)));
            }
            const pickedTaskName = yield vscode.window.showQuickPick(taskNames);
            if (pickedTaskName) {
                tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
                    if (pickedTaskName === task.name) {
                        if (projectFolder !== "") {
                            if (task.execution &&
                                task.execution instanceof vscode.ShellExecution &&
                                task.execution.commandLine) {
                                task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", projectFolder);
                            }
                        }
                        else {
                            if (task.execution &&
                                task.execution instanceof vscode.ShellExecution &&
                                task.execution.commandLine) {
                                task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", "${fileDirname}/");
                            }
                        }
                        yield vscode.tasks.executeTask(task);
                    }
                }));
            }
        }
        catch (err) {
            vscode.window.showInformationMessage(err);
        }
    });
}
exports.taskHandler = taskHandler;
//# sourceMappingURL=taskHandler.js.map