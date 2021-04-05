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
const taskHandler_1 = require("./handler/taskHandler");
const folderHandler_1 = require("./handler/folderHandler");
const modeHandler_1 = require("./handler/modeHandler");
const launchProvider_1 = require("./provider/launchProvider");
const propertiesProvider_1 = require("./provider/propertiesProvider");
const settingsProvider_1 = require("./provider/settingsProvider");
const taskProvider_1 = require("./provider/taskProvider");
const statusBarItems_1 = require("./items/statusBarItems");
const utils_1 = require("./utils");
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
function deactivate() {
    disposeProviderDisposables();
    disposeStatusBarItems();
    disposeCommands();
}
exports.deactivate = deactivate;
function initWorkspaceInstance() {
    if (!workspaceFolder) {
        return;
    }
    settingsProvider = new settingsProvider_1.SettingsProvider(workspaceFolder);
    propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspaceFolder, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    if (!pickedFolder) {
        return;
    }
    launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspaceFolder, pickedFolder, LAUNCH_TEMPLATE, LAUNCH_FILE);
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
    utils_1.disposeItem(taskProviderDisposable);
    utils_1.disposeItem(commandHandlerDisposable);
}
function disposeStatusBarItems() {
    utils_1.disposeItem(folderStatusBar);
    utils_1.disposeItem(modeStatusBar);
    utils_1.disposeItem(buildStatusBar);
    utils_1.disposeItem(runStatusBar);
    utils_1.disposeItem(debugStatusBar);
    utils_1.disposeItem(cleanStatusBar);
}
function disposeCommands() {
    utils_1.disposeItem(commandFolderDisposable);
    utils_1.disposeItem(commandModeDisposable);
    utils_1.disposeItem(commandBuildDisposable);
    utils_1.disposeItem(commandRunDisposable);
    utils_1.disposeItem(commandDebugDisposable);
    utils_1.disposeItem(commandCleanDisposable);
}
/**
INIT STATUS BAR
*/
function initFolderStatusBar(context) {
    folderStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(folderStatusBar);
    statusBarItems_1.updateFolderStatus(folderStatusBar, taskProvider);
    commandFolderDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => folderCallback());
    folderStatusBar.command = `${EXTENSION_NAME}.init`;
    context.subscriptions.push(commandFolderDisposable);
}
function initModeStatusBar(context) {
    modeStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(modeStatusBar);
    statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
    commandModeDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.mode`, () => modeCallback());
    modeStatusBar.command = `${EXTENSION_NAME}.mode`;
    context.subscriptions.push(commandModeDisposable);
}
function initBuildStatusBar(context) {
    buildStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(buildStatusBar);
    statusBarItems_1.updateBuildStatus(buildStatusBar);
    commandBuildDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.build`, () => buildCallback());
    buildStatusBar.command = `${EXTENSION_NAME}.build`;
    context.subscriptions.push(commandBuildDisposable);
}
function initRunStatusBar(context) {
    runStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(runStatusBar);
    statusBarItems_1.updateRunStatus(runStatusBar);
    commandRunDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => runCallback());
    runStatusBar.command = `${EXTENSION_NAME}.run`;
    context.subscriptions.push(commandRunDisposable);
}
function initDebugStatusBar(context) {
    debugStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(debugStatusBar);
    statusBarItems_1.updateDebugStatus(debugStatusBar);
    commandDebugDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.debug`, () => debugCallback());
    debugStatusBar.command = `${EXTENSION_NAME}.debug`;
    context.subscriptions.push(commandDebugDisposable);
}
function initCleanStatusBar(context) {
    cleanStatusBar = vscode.window.createStatusBarItem(STATUS_BAR_ALIGN, STATUS_BAR_PRIORITY);
    context.subscriptions.push(cleanStatusBar);
    statusBarItems_1.updateCleanStatus(cleanStatusBar);
    commandCleanDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.clean`, () => cleanCallback());
    cleanStatusBar.command = `${EXTENSION_NAME}.clean`;
    context.subscriptions.push(commandCleanDisposable);
}
/**
STATUS BAR CALLBACKS
*/
function folderCallback() {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield folderHandler_1.folderHandler();
        if (ret && ret.pickedFolder && ret.workspaceFolder) {
            pickedFolder = ret.pickedFolder;
            workspaceFolder = ret.workspaceFolder;
            initWorkspaceInstance();
            if (workspaceFolder && pickedFolder) {
                if (propertiesProvider) {
                    propertiesProvider.workspaceFolder = workspaceFolder;
                }
                if (taskProvider) {
                    taskProvider.pickedFolder = pickedFolder;
                    if (buildMode && architectureMode) {
                        taskProvider.buildMode = buildMode;
                        taskProvider.architectureMode = architectureMode;
                    }
                }
                if (launchProvider) {
                    launchProvider.pickedFolder = pickedFolder;
                    launchProvider.workspaceFolder = workspaceFolder;
                    launchProvider.updateFileData();
                }
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
    return __awaiter(this, void 0, void 0, function* () {
        if (!pickedFolder || !workspaceFolder) {
            return;
        }
        taskProvider.runDebugTask();
    });
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
//# sourceMappingURL=extension.js.map