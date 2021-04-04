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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskHandler_1 = require("./taskHandler");
const launchProvider_1 = require("./launchProvider");
const modeHandler_1 = require("./modeHandler");
const propertiesProvider_1 = require("./propertiesProvider");
const settingsProvider_1 = require("./settingsProvider");
const statusBarItems_1 = require("./statusBarItems");
const taskProvider_1 = require("./taskProvider");
const utils_1 = require("./utils");
const workspaceHandler_1 = require("./workspaceHandler");
const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";
const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;
let taskProviderDisposable;
let commandHandlerDisposable;
let commandFolderDisposable;
let commandModeDisposable;
let commandBuildDisposable;
let commandRunDisposable;
let commandDebugDisposable;
let commandCleanDisposable;
let settingsProvider;
let launchProvider;
let propertiesProvider;
let taskProvider;
let folderStatusBar;
let modeStatusBar;
let buildStatusBar;
let runStatusBar;
let debugStatusBar;
let cleanStatusBar;
let workspaceFolder;
let pickedFolder;
let buildMode = utils_1.Builds.debug;
let architectureMode = utils_1.Architectures.x64;
let promiseMessage;
function activate(context) {
    if (!vscode.workspace.workspaceFolders ||
        vscode.workspace.workspaceFolders.length === 0) {
        return;
    }
    initFolderStatusBar(context);
    initModeStatusBar(context);
    initBuildStatusBar(context);
    initRunStatusBar(context);
    initDebugStatusBar(context);
    initCleanStatusBar(context);
    workspaceInstance(context);
}
exports.activate = activate;
function initFolderStatusBar(context) {
    folderStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(folderStatusBar);
    statusBarItems_1.updateFolderStatus(folderStatusBar, taskProvider);
    commandFolderDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => folderCallback());
    folderStatusBar.command = `${EXTENSION_NAME}.init`;
    context.subscriptions.push(commandFolderDisposable);
}
function initModeStatusBar(context) {
    modeStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY - 1);
    context.subscriptions.push(modeStatusBar);
    statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
    commandModeDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.mode`, () => modeCallback());
    modeStatusBar.command = `${EXTENSION_NAME}.mode`;
    context.subscriptions.push(commandModeDisposable);
}
function initBuildStatusBar(context) {
    buildStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY - 2);
    context.subscriptions.push(buildStatusBar);
    statusBarItems_1.updateBuildStatus(buildStatusBar);
    commandBuildDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.build`, () => buildCallback());
    buildStatusBar.command = `${EXTENSION_NAME}.build`;
    context.subscriptions.push(commandBuildDisposable);
}
function initRunStatusBar(context) {
    runStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY - 3);
    context.subscriptions.push(runStatusBar);
    statusBarItems_1.updateRunStatus(runStatusBar);
    commandRunDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => runCallback());
    runStatusBar.command = `${EXTENSION_NAME}.run`;
    context.subscriptions.push(commandRunDisposable);
}
function initDebugStatusBar(context) {
    debugStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY - 4);
    context.subscriptions.push(debugStatusBar);
    statusBarItems_1.updateDebugStatus(debugStatusBar);
    commandDebugDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.debug`, () => debugCallback());
    debugStatusBar.command = `${EXTENSION_NAME}.debug`;
    context.subscriptions.push(commandDebugDisposable);
}
function initCleanStatusBar(context) {
    cleanStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY - 5);
    context.subscriptions.push(cleanStatusBar);
    statusBarItems_1.updateCleanStatus(cleanStatusBar);
    commandCleanDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.clean`, () => cleanCallback());
    cleanStatusBar.command = `${EXTENSION_NAME}.clean`;
    context.subscriptions.push(commandCleanDisposable);
}
function folderCallback() {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield workspaceHandler_1.workspaceHandler();
        if (ret && ret.pickedFolder && ret.workspaceFolder) {
            pickedFolder = ret.pickedFolder;
            workspaceFolder = ret.workspaceFolder;
            initWorkspaceInstance();
            if (propertiesProvider && workspaceFolder && pickedFolder) {
                propertiesProvider.workspaceFolder = workspaceFolder;
            }
            taskProvider.pickedFolder = pickedFolder;
            if (buildMode && architectureMode) {
                taskProvider.buildMode = buildMode;
                taskProvider.architectureMode = architectureMode;
            }
            statusBarItems_1.updateFolderStatus(folderStatusBar, taskProvider);
        }
    });
}
function modeCallback() {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield modeHandler_1.modeHandler(settingsProvider);
        if (ret && ret.pickedArchitecture && ret.pickedMode) {
            buildMode = ret.pickedMode;
            architectureMode = ret.pickedArchitecture;
            if (taskProvider) {
                taskProvider.buildMode = buildMode;
                taskProvider.architectureMode = architectureMode;
            }
            statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
        }
    });
}
function buildCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
        if (task.name.includes(utils_1.Tasks.build)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", projectFolder);
            }
            yield vscode.tasks.executeTask(task);
        }
    }));
}
function runCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
        if (task.name.includes(utils_1.Tasks.run)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", projectFolder);
            }
            yield vscode.tasks.executeTask(task);
        }
    }));
}
function debugCallback() {
    vscode.window.showInformationMessage("You pressed debug!");
}
function cleanCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach((task) => __awaiter(this, void 0, void 0, function* () {
        if (task.name.includes(utils_1.Tasks.clean)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace("FILE_DIR", projectFolder);
            }
            yield vscode.tasks.executeTask(task);
        }
    }));
}
function tasksCallback() {
    if (!workspaceFolder) {
        if (!promiseMessage) {
            promiseMessage = vscode.window.showErrorMessage("You have to select a folder first.");
        }
    }
    else {
        promiseMessage = undefined;
        if (taskProvider) {
            taskProvider.getTasks();
            taskHandler_1.taskHandler(taskProvider);
        }
    }
}
function initWorkspaceInstance() {
    if (!workspaceFolder) {
        return;
    }
    settingsProvider = new settingsProvider_1.SettingsProvider(workspaceFolder);
    propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspaceFolder, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspaceFolder, LAUNCH_TEMPLATE, LAUNCH_FILE);
    if (!pickedFolder) {
        return;
    }
    taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider, pickedFolder, buildMode, architectureMode);
}
function workspaceInstance(context) {
    initWorkspaceInstance();
    disposeProviderDisposables();
    taskProviderDisposable = vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.tasks`, () => tasksCallback());
    context.subscriptions.push(taskProviderDisposable);
    context.subscriptions.push(commandHandlerDisposable);
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks();
        propertiesProvider.updateFileData();
        launchProvider.updateFileData();
    });
}
function disposeProviderDisposables() {
    if (taskProviderDisposable) {
        taskProviderDisposable.dispose();
    }
    if (commandHandlerDisposable) {
        commandHandlerDisposable.dispose();
    }
}
function disposeStatusBarItems() {
    if (folderStatusBar) {
        folderStatusBar.dispose();
    }
    if (modeStatusBar) {
        modeStatusBar.dispose();
    }
    if (buildStatusBar) {
        buildStatusBar.dispose();
    }
    if (runStatusBar) {
        runStatusBar.dispose();
    }
    if (debugStatusBar) {
        debugStatusBar.dispose();
    }
    if (cleanStatusBar) {
        cleanStatusBar.dispose();
    }
}
function disposeCommands() {
    if (commandFolderDisposable) {
        commandFolderDisposable.dispose();
    }
}
function deactivate() {
    disposeProviderDisposables();
    disposeStatusBarItems();
    disposeCommands();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map