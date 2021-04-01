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
const commandHandler_1 = require("./commandHandler");
const launchProvider_1 = require("./launchProvider");
const propertiesProvider_1 = require("./propertiesProvider");
const settingsProvider_1 = require("./settingsProvider");
const taskProvider_1 = require("./taskProvider");
const workspaceHandler_1 = require("./workspaceHandler");
const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";
let taskProviderDisposable;
let commandHandlerDisposable;
let commandInitDisposable;
let workspacePath;
let statusBar;
function activate(context) {
    // Status bar item
    const statusBarAlign = vscode.StatusBarAlignment.Left;
    const statusBarPriority = -1;
    statusBar = vscode.window.createStatusBarItem(statusBarAlign, statusBarPriority);
    context.subscriptions.push(statusBar);
    workspacePath = workspaceHandler_1.updateStatus(statusBar);
    // Update statusBar bar item based on events
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorViewColumn((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((e) => updateStatusCallback()));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((e) => updateStatusCallback()));
    commandInitDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => initWorkspaceCallback());
    statusBar.command = `${EXTENSION_NAME}.init`;
    context.subscriptions.push(commandInitDisposable);
    workspaceInstance(context);
}
exports.activate = activate;
function initWorkspaceCallback() {
    return __awaiter(this, void 0, void 0, function* () {
        workspacePath = yield workspaceHandler_1.workspaceHandler();
        initWorkspaceInstance();
    });
}
function updateStatusCallback() {
    const newWorkspacePath = workspaceHandler_1.updateStatus(statusBar);
    if (newWorkspacePath !== workspacePath) {
        workspacePath = newWorkspacePath;
        initWorkspaceInstance();
    }
}
function initWorkspaceInstance() {
    if (undefined === workspacePath) {
        return;
    }
    const settingsProvider = new settingsProvider_1.SettingsProvider(workspacePath);
    const propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    const launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspacePath, LAUNCH_TEMPLATE, LAUNCH_FILE);
    const taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider);
    return { settingsProvider, propertiesProvider, launchProvider, taskProvider };
}
function workspaceInstance(context) {
    if (undefined === workspacePath) {
        return;
    }
    const providers = initWorkspaceInstance();
    if (undefined === providers) {
        return;
    }
    const settingsProvider = providers.settingsProvider;
    const propertiesProvider = providers.propertiesProvider;
    const launchProvider = providers.launchProvider;
    const taskProvider = providers.taskProvider;
    deactivateProviderDisposables();
    taskProviderDisposable = vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => commandHandler_1.commandHandler(taskProvider));
    context.subscriptions.push(taskProviderDisposable);
    context.subscriptions.push(commandHandlerDisposable);
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks(true);
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
    if (statusBar) {
        statusBar.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map