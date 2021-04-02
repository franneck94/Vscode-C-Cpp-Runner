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
let taskProviderDisposable;
let commandHandlerDisposable;
let commandInitDisposable;
let commandModeDisposable;
let settingsProvider;
let launchProvider;
let propertiesProvider;
let taskProvider;
let workspacePath;
let folderStatusBar;
let modeStatusBar;
let buildMode = utils_1.Builds.debug;
let architectureMode = utils_1.Architectures.x64;
function activate(context) {
    // Folder status bar item
    const folderStatusBarAlign = vscode.StatusBarAlignment.Left;
    const folderStatusBarPriority = 2;
    folderStatusBar = vscode.window.createStatusBarItem(folderStatusBarAlign, folderStatusBarPriority);
    context.subscriptions.push(folderStatusBar);
    workspacePath = statusBarItems_1.updateFolderStatus(folderStatusBar);
    // Mode status bar item
    const modeStatusBarAlign = vscode.StatusBarAlignment.Left;
    const modeStatusBarPriority = 1;
    modeStatusBar = vscode.window.createStatusBarItem(modeStatusBarAlign, modeStatusBarPriority);
    context.subscriptions.push(modeStatusBar);
    statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
    // Update folder status bar item based on events
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorViewColumn((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((e) => updateStatusCallback()));
    commandInitDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => __awaiter(this, void 0, void 0, function* () {
        workspacePath = yield workspaceHandler_1.workspaceHandler();
        initWorkspaceInstance();
    }));
    folderStatusBar.command = `${EXTENSION_NAME}.init`;
    context.subscriptions.push(commandInitDisposable);
    commandModeDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.mode`, () => __awaiter(this, void 0, void 0, function* () {
        const ret = yield modeHandler_1.modeHandler(settingsProvider);
        if (undefined !== ret) {
            buildMode = ret.pickedMode;
            architectureMode = ret.pickedArchitecture;
            taskProvider.buildMode = buildMode;
            taskProvider.architectureMode = architectureMode;
            statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
        }
    }));
    modeStatusBar.command = `${EXTENSION_NAME}.mode`;
    context.subscriptions.push(commandModeDisposable);
    workspaceInstance(context);
}
exports.activate = activate;
function updateStatusCallback() {
    const newWorkspacePath = statusBarItems_1.updateFolderStatus(folderStatusBar);
    if (newWorkspacePath !== workspacePath) {
        workspacePath = newWorkspacePath;
        initWorkspaceInstance();
    }
}
function initWorkspaceInstance() {
    if (undefined === workspacePath) {
        return;
    }
    settingsProvider = new settingsProvider_1.SettingsProvider(workspacePath);
    propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspacePath, LAUNCH_TEMPLATE, LAUNCH_FILE);
    taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider, buildMode, architectureMode);
}
function workspaceInstance(context) {
    if (undefined === workspacePath) {
        return;
    }
    initWorkspaceInstance();
    deactivateProviderDisposables();
    taskProviderDisposable = vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => {
        taskProvider.getTasks();
        taskHandler_1.taskHandler(taskProvider);
    });
    context.subscriptions.push(taskProviderDisposable);
    context.subscriptions.push(commandHandlerDisposable);
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks();
        propertiesProvider.updateFileData();
        launchProvider.updateFileData();
    });
}
function deactivateProviderDisposables() {
    if (taskProviderDisposable) {
        taskProviderDisposable.dispose();
    }
    if (commandHandlerDisposable) {
        commandHandlerDisposable.dispose();
    }
}
function deactivate() {
    deactivateProviderDisposables();
    if (commandInitDisposable) {
        commandInitDisposable.dispose();
    }
    if (folderStatusBar) {
        folderStatusBar.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map