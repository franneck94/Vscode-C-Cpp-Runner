"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
const EXTENSION_NAME = 'C_Cpp_Runner';
class TaskProvider {
    constructor(settingsProvider, propertiesProvider, pickedFolder, buildMode, architectureMode) {
        this.settingsProvider = settingsProvider;
        this.propertiesProvider = propertiesProvider;
        this.pickedFolder = pickedFolder;
        this.buildMode = buildMode;
        this.architectureMode = architectureMode;
        const extDirectory = path.dirname(path.dirname(__dirname));
        const templateDirectory = path.join(extDirectory, 'src', '_templates');
        this.tasksFile = path.join(templateDirectory, 'tasks_template.json');
        this.makefileFile = path.join(templateDirectory, 'Makefile');
        if (!this.pickedFolder) {
            this.pickedFolder = this.propertiesProvider.workspaceFolder;
        }
        this.getTasks();
    }
    async resolveTask(task) {
        return task;
    }
    provideTasks() {
        return this.getTasks();
    }
    getTasks() {
        if (!this.pickedFolder) {
            this.pickedFolder = this.propertiesProvider.workspaceFolder;
        }
        const language = utils_1.getLanguage(this.pickedFolder);
        this.setTasksDefinition(language);
        if (!this.tasks) {
            return [];
        }
        return this.tasks;
    }
    setTasksDefinition(language) {
        const configJson = utils_1.readJsonFile(this.tasksFile);
        if (!configJson) {
            return [];
        }
        this.tasks = [];
        for (const taskJson of configJson.tasks) {
            if (taskJson.type !== 'shell') {
                continue;
            }
            if (undefined !== taskJson.options) {
                if (taskJson.options.hide) {
                    continue;
                }
            }
            this.updateTaskBasedOnSettings(taskJson, language);
            const shellCommand = `${taskJson.command} ${taskJson.args.join(' ')}`;
            const definition = {
                type: 'shell',
                task: taskJson.label,
            };
            const problemMatcher = '$gcc';
            const scope = vscode.TaskScope.Workspace;
            const task = new vscode.Task(definition, scope, taskJson.label, EXTENSION_NAME, new vscode.ShellExecution(shellCommand), problemMatcher);
            this.tasks.push(task);
        }
        this.addDebugTask();
        return this.tasks;
    }
    updateTaskBasedOnSettings(taskJson, language) {
        const settings = this.settingsProvider;
        const pickedFolder = this.pickedFolder;
        const workspaceFolder = this.propertiesProvider.workspaceFolder;
        const folder = pickedFolder.replace(workspaceFolder, path.basename(workspaceFolder));
        taskJson.label = taskJson.label.replace(taskJson.label.split(': ')[1], folder);
        taskJson.label = utils_1.replaceBackslashes(taskJson.label);
        taskJson.args[1] = `--file=${this.makefileFile}`;
        taskJson.args.push(`COMPILATION_MODE=${this.buildMode}`);
        taskJson.args.push(`EXECUTABLE_NAME=out${this.buildMode}`);
        taskJson.args.push(`LANGUAGE_MODE=${language}`);
        const includesClean = taskJson.label.includes(utils_1.Tasks.clean);
        const includesRun = taskJson.label.includes(utils_1.Tasks.run);
        if (!includesClean && !includesRun) {
            taskJson.args.push(`ENABLE_WARNINGS=${+settings.enableWarnings}`);
            taskJson.args.push(`WARNINGS="${settings.warnings}"`);
            taskJson.args.push(`WARNINGS_AS_ERRORS=${+settings.warningsAsError}`);
            if (language === utils_1.Languages.c) {
                taskJson.args.push(`C_COMPILER=${settings.compilerPathC}`);
                taskJson.args.push(`C_STANDARD=${settings.standardC}`);
            }
            else {
                taskJson.args.push(`CPP_COMPILER=${settings.compilerPathCpp}`);
                taskJson.args.push(`CPP_STANDARD=${settings.standardCpp}`);
            }
            if (settings.compilerArgs) {
                taskJson.args.push(`COMPILER_ARGS=${settings.compilerArgs}`);
            }
            if (settings.linkerArgs) {
                taskJson.args.push(`LINKER_ARGS=${settings.linkerArgs}`);
            }
            if (settings.includePaths) {
                taskJson.args.push(`INCLUDE_PATHS=${settings.includePaths}`);
            }
            const architectureStr = this.architectureMode === utils_1.Architectures.x64 ? '64' : '32';
            taskJson.args.push(`ARCHITECTURE=${architectureStr}`);
        }
        taskJson.command = settings.makePath;
    }
    getProjectFolder() {
        let projectFolder = '';
        if (this.pickedFolder !== undefined) {
            projectFolder = this.pickedFolder;
        }
        else {
            projectFolder = this.propertiesProvider.workspaceFolder;
        }
        return projectFolder;
    }
    addDebugTask() {
        if (!this.tasks) {
            return;
        }
        const folder = this.pickedFolder.replace(this.propertiesProvider.workspaceFolder, path.basename(this.propertiesProvider.workspaceFolder));
        let label = `Debug: ${this.pickedFolder}`;
        label = label.replace(label.split(': ')[1], folder);
        label = utils_1.replaceBackslashes(label);
        const definition = {
            type: 'shell',
            task: label,
        };
        const problemMatcher = '$gcc';
        const scope = vscode.TaskScope.Workspace;
        const task = new vscode.Task(definition, scope, label, EXTENSION_NAME, undefined, problemMatcher);
        this.tasks.push(task);
    }
    async runDebugTask() {
        const uriWorkspaceFolder = vscode.Uri.file(this.propertiesProvider.workspaceFolder);
        const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
        const config = utils_1.readJsonFile(path.join(this.propertiesProvider.workspaceFolder, '.vscode', 'launch.json'));
        await vscode.debug.startDebugging(folder, config.configurations[0]);
    }
}
exports.TaskProvider = TaskProvider;
//# sourceMappingURL=taskProvider.js.map