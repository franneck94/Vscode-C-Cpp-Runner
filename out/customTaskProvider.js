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
exports.CppBuildTaskProvider = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class CppBuildTaskProvider {
    constructor() {
        this.extDirectory = path.dirname(__dirname);
        this.tasksFile = path.join(this.extDirectory, "tasks", "tasks.json");
        this.makefileFile = path.join(this.extDirectory, "tasks", "Makefile");
        this.problemMatcher = "$gcc";
        if (!utils_1.pathExists(this.tasksFile) || !utils_1.pathExists(this.makefileFile)) {
            return;
        }
        this.getTasks();
    }
    provideTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getTasks();
        });
    }
    getTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            const emptyTasks = [];
            if (!editor) {
                return emptyTasks;
            }
            const fileExt = path.extname(editor.document.fileName);
            if (!fileExt) {
                return emptyTasks;
            }
            if (!this.isSourceFile(fileExt)) {
                return emptyTasks;
            }
            this.tasks = [];
            if (!utils_1.pathExists(this.tasksFile)) {
                return this.tasks;
            }
            let configJson;
            try {
                const fileContent = fs.readFileSync(this.tasksFile, "utf-8");
                configJson = JSON.parse(fileContent);
            }
            catch (err) {
                return this.tasks;
            }
            if (!configJson.tasks) {
                return this.tasks;
            }
            for (let taskJson of configJson.tasks) {
                if (taskJson.type !== "shell") {
                    continue;
                }
                if (taskJson.options !== undefined) {
                    if (taskJson.options.hide === true) {
                        continue;
                    }
                }
                taskJson.args[1] = `--file=${this.makefileFile}`;
                const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;
                const definition = {
                    type: "shell",
                    task: taskJson.label
                };
                const scope = vscode.TaskScope.Workspace;
                const task = new vscode.Task(definition, scope, taskJson.label, "C_Cpp_Runner", new vscode.ShellExecution(shellCommand), this.problemMatcher);
                this.tasks.push(task);
            }
            return this.tasks;
        });
    }
    isSourceFile(fileExt) {
        // Don't offer tasks for header files.
        const fileExtLower = fileExt.toLowerCase();
        const isHeader = !fileExt || [
            ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
        ].some(ext => fileExtLower === ext);
        if (isHeader) {
            return false;
        }
        // Don't offer tasks if the active file's extension is not a recognized C/C++ extension.
        let fileIsCpp;
        let fileIsC;
        if (fileExt === ".C") { // ".C" file extensions are both C and C++.
            fileIsCpp = true;
            fileIsC = true;
        }
        else {
            fileIsCpp = [".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"].some(ext => fileExtLower === ext);
            fileIsC = fileExtLower === ".c";
        }
        if (!(fileIsCpp || fileIsC)) {
            return false;
        }
        return true;
    }
}
exports.CppBuildTaskProvider = CppBuildTaskProvider;
//# sourceMappingURL=customTaskProvider.js.map