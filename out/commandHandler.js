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
            let provideSingleTasks = false;
            let provideBuildFolderTasks = false;
            const editor = vscode.window.activeTextEditor;
            if (undefined === editor || undefined === taskProvider.tasks) {
                throw TypeError("No tasks provided.");
            }
            const fileExt = path.extname(editor.document.fileName);
            if (fileExt && utils_1.isSourceFile(fileExt)) {
                provideSingleTasks = true;
            }
            const workspaceFolder = taskProvider.propertiesProvider.workspacePath;
            const buildFolder = path.join(workspaceFolder, "build");
            if (utils_1.pathExists(buildFolder)) {
                provideBuildFolderTasks = true;
            }
            let taskNames = [];
            taskProvider.tasks.forEach((task) => {
                taskNames.push(task.name);
            });
            if (!provideSingleTasks) {
                taskNames = taskNames.filter((name) => !name.toLowerCase().includes("single"));
            }
            if (!provideBuildFolderTasks) {
                taskNames = taskNames.filter((name) => !(name.toLowerCase().includes("run") ||
                    name.toLowerCase().includes("clean")));
            }
            const pickedTaskName = yield vscode.window.showQuickPick(taskNames);
            if (pickedTaskName) {
                taskProvider.tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
                    if (pickedTaskName === task.name) {
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
//# sourceMappingURL=commandHandler.js.map