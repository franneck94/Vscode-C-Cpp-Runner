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
exports.TaskProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
const extensionName = 'C_Cpp_Runner';
class TaskProvider {
    constructor(settingsProvider) {
        this.settingsProvider = settingsProvider;
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "tasks");
        this.tasksFile = path.join(tasksDirectory, "tasks.json");
        this.makefileFile = path.join(tasksDirectory, "Makefile");
        this.problemMatcher = "$gcc";
        if (!utils_1.pathExists(this.tasksFile) || !utils_1.pathExists(this.makefileFile)) {
            return;
        }
        this.getTasks();
    }
    resolveTask(task, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return task;
        });
    }
    provideTasks() {
        return this.getTasks();
    }
    getTasks(ignoreLanguageMode = false) {
        let languageMode;
        if (false === ignoreLanguageMode) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return [];
            }
            const fileDirName = path.dirname(editor.document.fileName);
            languageMode = utils_1.getLanguageMode(fileDirName);
        }
        else {
            languageMode = utils_1.LanguageMode.c;
        }
        let configJson;
        try {
            const fileContent = fs.readFileSync(this.tasksFile, "utf-8");
            configJson = JSON.parse(fileContent);
        }
        catch (err) {
            return [];
        }
        if (!configJson.tasks) {
            return [];
        }
        this.tasks = [];
        for (let taskJson of configJson.tasks) {
            if (taskJson.type !== "shell") {
                continue;
            }
            if (taskJson.options !== undefined) {
                if (taskJson.options.hide === true) {
                    continue;
                }
            }
            this.updateTaskBasedOnSettings(taskJson, languageMode);
            const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;
            const definition = {
                type: "shell",
                task: taskJson.label
            };
            const scope = vscode.TaskScope.Workspace;
            const task = new vscode.Task(definition, scope, taskJson.label, extensionName, new vscode.ShellExecution(shellCommand), this.problemMatcher);
            this.tasks.push(task);
        }
        return this.tasks;
    }
    updateTaskBasedOnSettings(taskJson, languageMode) {
        taskJson.args[1] = `--file=${this.makefileFile}`;
        taskJson.args.push(`ENABLE_WARNINGS=${+this.settingsProvider.enableWarnings}`);
        taskJson.args.push(`WARNINGS="${this.settingsProvider.warnings}"`);
        taskJson.args.push(`WARNINGS_AS_ERRORS=${+this.settingsProvider.warningsAsError}`);
        taskJson.args.push(`C_COMPILER=${this.settingsProvider.compilerPathC}`);
        taskJson.args.push(`CPP_COMPILER=${this.settingsProvider.compilerPathCpp}`);
        taskJson.args.push(`LANGUAGE_MODE=${languageMode}`);
        taskJson.args.push(`C_STANDARD=${this.settingsProvider.standardC}`);
        taskJson.args.push(`CPP_STANDARD=${this.settingsProvider.standardCpp}`);
        taskJson.command = this.settingsProvider.makePath;
    }
}
exports.TaskProvider = TaskProvider;
//# sourceMappingURL=taskProvider.js.map