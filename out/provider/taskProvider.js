"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
const types_1 = require("../types");
class TaskProvider {
    constructor(_settingsProvider, _workspaceFolder, _pickedFolder, _buildMode, _architectureMode) {
        this._settingsProvider = _settingsProvider;
        this._workspaceFolder = _workspaceFolder;
        this._pickedFolder = _pickedFolder;
        this._buildMode = _buildMode;
        this._architectureMode = _architectureMode;
        const extDirectory = path.dirname(__dirname);
        const templateDirectory = path.join(extDirectory, 'src', '_templates');
        this._tasksFile = path.join(templateDirectory, 'tasks_template.json');
        this._makefileFile = path.join(templateDirectory, 'Makefile');
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
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
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
        }
        const language = utils_1.getLanguage(this.activeFolder);
        this.setTasksDefinition(language);
        if (!this.tasks) {
            return [];
        }
        return this.tasks;
    }
    setTasksDefinition(language) {
        const configJson = utils_1.readJsonFile(this._tasksFile);
        if (!configJson) {
            return [];
        }
        this.tasks = [];
        for (const taskJson of configJson.tasks) {
            if (taskJson.type !== 'shell') {
                continue;
            }
            if (taskJson.options) {
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
            const task = new types_1.Task(definition, scope, taskJson.label, 'C_Cpp_Runner', new vscode.ShellExecution(shellCommand), problemMatcher);
            this.tasks.push(task);
        }
        this.addDebugTask();
        return this.tasks;
    }
    updateTaskBasedOnSettings(taskJson, language) {
        const settings = this._settingsProvider;
        const activeFolder = this.activeFolder;
        const workspaceFolder = this.workspaceFolder;
        const folder = activeFolder.replace(workspaceFolder, path.basename(workspaceFolder));
        taskJson.label = taskJson.label.replace(taskJson.label.split(': ')[1], folder);
        taskJson.label = utils_1.replaceBackslashes(taskJson.label);
        taskJson.args[1] = `--file=${this._makefileFile}`;
        taskJson.args.push(`COMPILATION_MODE=${this.buildMode}`);
        taskJson.args.push(`EXECUTABLE_NAME=out${this.buildMode}`);
        taskJson.args.push(`LANGUAGE_MODE=${language}`);
        const cleanTask = taskJson.label.includes(types_1.Tasks.clean);
        const runTask = taskJson.label.includes(types_1.Tasks.run);
        if (!cleanTask && !runTask) {
            taskJson.args.push(`ENABLE_WARNINGS=${+settings.enableWarnings}`);
            taskJson.args.push(`WARNINGS='${settings.warnings}'`);
            taskJson.args.push(`WARNINGS_AS_ERRORS=${+settings.warningsAsError}`);
            if (language === types_1.Languages.c) {
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
            const architectureStr = this.architectureMode === types_1.Architectures.x64 ? '64' : '32';
            taskJson.args.push(`ARCHITECTURE=${architectureStr}`);
        }
        taskJson.command = settings.makePath;
    }
    getProjectFolder() {
        let projectFolder = '';
        if (this.activeFolder) {
            projectFolder = this.activeFolder;
        }
        else {
            projectFolder = this.workspaceFolder;
        }
        return projectFolder;
    }
    addDebugTask() {
        if (!this.tasks) {
            return;
        }
        const folder = this.activeFolder.replace(this.workspaceFolder, path.basename(this.workspaceFolder));
        let label = `Debug: ${this.activeFolder}`;
        label = label.replace(label.split(': ')[1], folder);
        label = utils_1.replaceBackslashes(label);
        const definition = {
            type: 'shell',
            task: label,
        };
        const problemMatcher = '$gcc';
        const scope = vscode.TaskScope.Workspace;
        const task = new types_1.Task(definition, scope, label, 'C_Cpp_Runner', undefined, problemMatcher);
        this.tasks.push(task);
    }
    async runDebugTask() {
        const uriWorkspaceFolder = vscode.Uri.file(this.workspaceFolder);
        const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
        const config = utils_1.readJsonFile(path.join(this.workspaceFolder, '.vscode', 'launch.json'));
        await vscode.debug.startDebugging(folder, config.configurations[0]);
    }
    get architectureMode() {
        return this._architectureMode;
    }
    set architectureMode(value) {
        this._architectureMode = value;
    }
    get buildMode() {
        return this._buildMode;
    }
    set buildMode(value) {
        this._buildMode = value;
    }
    get activeFolder() {
        return this._pickedFolder;
    }
    set activeFolder(value) {
        this._pickedFolder = value;
    }
    get workspaceFolder() {
        return this._workspaceFolder;
    }
    set workspaceFolder(value) {
        this._workspaceFolder = value;
    }
}
exports.TaskProvider = TaskProvider;
//# sourceMappingURL=taskProvider.js.map