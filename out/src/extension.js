"use strict";
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
const types_1 = require("./types");
const PROPERTIES_TEMPLATE = 'properties_template.json';
const PROPERTIES_FILE = 'c_cpp_properties.json';
const LAUNCH_TEMPLATE = 'launch_template.json';
const LAUNCH_FILE = 'launch.json';
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
let buildMode = types_1.Builds.debug;
let architectureMode = types_1.Architectures.x64;
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
    taskProviderDisposable = vscode.tasks.registerTaskProvider('C_Cpp_Runner', taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand('C_Cpp_Runner.tasks', () => tasksCallback());
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
function initFolderStatusBar(context) {
    folderStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(folderStatusBar);
    statusBarItems_1.updateFolderStatus(folderStatusBar, taskProvider);
    commandFolderDisposable = vscode.commands.registerCommand('C_Cpp_Runner.init', () => folderCallback());
    folderStatusBar.command = 'C_Cpp_Runner.init';
    context.subscriptions.push(commandFolderDisposable);
}
function initModeStatusBar(context) {
    modeStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(modeStatusBar);
    statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
    commandModeDisposable = vscode.commands.registerCommand('C_Cpp_Runner.mode', () => modeCallback());
    modeStatusBar.command = 'C_Cpp_Runner.mode';
    context.subscriptions.push(commandModeDisposable);
}
function initBuildStatusBar(context) {
    buildStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(buildStatusBar);
    statusBarItems_1.updateBuildStatus(buildStatusBar);
    commandBuildDisposable = vscode.commands.registerCommand('C_Cpp_Runner.build', () => buildCallback());
    buildStatusBar.command = 'C_Cpp_Runner.build';
    context.subscriptions.push(commandBuildDisposable);
}
function initRunStatusBar(context) {
    runStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(runStatusBar);
    statusBarItems_1.updateRunStatus(runStatusBar);
    commandRunDisposable = vscode.commands.registerCommand('C_Cpp_Runner.run', () => runCallback());
    runStatusBar.command = 'C_Cpp_Runner.run';
    context.subscriptions.push(commandRunDisposable);
}
function initDebugStatusBar(context) {
    debugStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(debugStatusBar);
    statusBarItems_1.updateDebugStatus(debugStatusBar);
    commandDebugDisposable = vscode.commands.registerCommand('C_Cpp_Runner.debug', () => debugCallback());
    debugStatusBar.command = 'C_Cpp_Runner.debug';
    context.subscriptions.push(commandDebugDisposable);
}
function initCleanStatusBar(context) {
    cleanStatusBar = utils_1.createStatusBarItem();
    context.subscriptions.push(cleanStatusBar);
    statusBarItems_1.updateCleanStatus(cleanStatusBar);
    commandCleanDisposable = vscode.commands.registerCommand('C_Cpp_Runner.clean', () => cleanCallback());
    cleanStatusBar.command = 'C_Cpp_Runner.clean';
    context.subscriptions.push(commandCleanDisposable);
}
async function folderCallback() {
    const ret = await folderHandler_1.folderHandler();
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
}
async function modeCallback() {
    const ret = await modeHandler_1.modeHandler(settingsProvider);
    if (ret && ret.pickedArchitecture && ret.pickedMode) {
        buildMode = ret.pickedMode;
        architectureMode = ret.pickedArchitecture;
        if (taskProvider) {
            taskProvider.buildMode = buildMode;
            taskProvider.architectureMode = architectureMode;
        }
        statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
    }
}
function buildCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach(async (task) => {
        if (task.name.includes(types_1.Tasks.build)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace('FILE_DIR', projectFolder);
            }
            await vscode.tasks.executeTask(task);
        }
    });
}
function runCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach(async (task) => {
        if (task.name.includes(types_1.Tasks.run)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace('FILE_DIR', projectFolder);
            }
            await vscode.tasks.executeTask(task);
        }
    });
}
async function debugCallback() {
    if (!pickedFolder || !workspaceFolder) {
        return;
    }
    taskProvider.runDebugTask();
}
function cleanCallback() {
    if (!taskProvider || !taskProvider.tasks) {
        return;
    }
    taskProvider.getTasks();
    const projectFolder = taskProvider.getProjectFolder();
    taskProvider.tasks.forEach(async (task) => {
        if (task.name.includes(types_1.Tasks.clean)) {
            if (task.execution &&
                task.execution instanceof vscode.ShellExecution &&
                task.execution.commandLine) {
                task.execution.commandLine = task.execution.commandLine.replace('FILE_DIR', projectFolder);
            }
            await vscode.tasks.executeTask(task);
        }
    });
}
function tasksCallback() {
    if (!workspaceFolder) {
        if (!promiseMessage) {
            promiseMessage = vscode.window.showErrorMessage('You have to select a folder first.');
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