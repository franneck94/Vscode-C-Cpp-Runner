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
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
const EXTENSION_NAME = "C_Cpp_Runner";
class TaskProvider {
    constructor(settingsProvider, propertiesProvider) {
        this.settingsProvider = settingsProvider;
        this.propertiesProvider = propertiesProvider;
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "templates");
        this.tasksFile = path.join(tasksDirectory, "tasks_template.json");
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
    getTasks(ignoreLanguage = false) {
        const editor = vscode.window.activeTextEditor;
        let language;
        if (false === ignoreLanguage) {
            language = utils_1.getLanguageFromEditor(editor, this.propertiesProvider.workspacePath);
        }
        else {
            language = utils_1.Languages.c;
        }
        let configJson = utils_1.readJsonFile(this.tasksFile);
        if (undefined === configJson) {
            return [];
        }
        this.tasks = [];
        for (let taskJson of configJson.tasks) {
            if ("shell" !== taskJson.type) {
                continue;
            }
            if (undefined !== taskJson.options) {
                if (true === taskJson.options.hide) {
                    continue;
                }
            }
            this.updateTaskBasedOnSettings(taskJson, language);
            const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;
            const definition = {
                type: "shell",
                task: taskJson.label,
            };
            const scope = vscode.TaskScope.Workspace;
            const task = new vscode.Task(definition, scope, taskJson.label, EXTENSION_NAME, new vscode.ShellExecution(shellCommand), this.problemMatcher);
            this.tasks.push(task);
        }
        return this.tasks;
    }
    updateTaskBasedOnSettings(taskJson, language) {
        taskJson.args[1] = `--file=${this.makefileFile}`;
        taskJson.args.push(`ENABLE_WARNINGS=${+this.settingsProvider.enableWarnings}`);
        taskJson.args.push(`WARNINGS="${this.settingsProvider.warnings}"`);
        taskJson.args.push(`WARNINGS_AS_ERRORS=${+this.settingsProvider.warningsAsError}`);
        taskJson.args.push(`C_COMPILER=${this.settingsProvider.compilerPathC}`);
        taskJson.args.push(`CPP_COMPILER=${this.settingsProvider.compilerPathCpp}`);
        taskJson.args.push(`LANGUAGE_MODE=${language}`);
        taskJson.args.push(`C_STANDARD=${this.settingsProvider.standardC}`);
        taskJson.args.push(`CPP_STANDARD=${this.settingsProvider.standardCpp}`);
        if (this.settingsProvider.compilerArgs) {
            taskJson.args.push(`COMPILER_ARGS=${this.settingsProvider.compilerArgs}`);
        }
        if (this.settingsProvider.linkerArgs) {
            taskJson.args.push(`LINKER_ARGS=${this.settingsProvider.linkerArgs}`);
        }
        if (this.settingsProvider.includePaths) {
            taskJson.args.push(`INCLUDE_PATHS=${this.settingsProvider.includePaths}`);
        }
        taskJson.command = this.settingsProvider.makePath;
    }
}
exports.TaskProvider = TaskProvider;
//# sourceMappingURL=taskProvider.js.map