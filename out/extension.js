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
let folderStatusBar;
let modeStatusBar;
const statusBarAlign = vscode.StatusBarAlignment.Left;
const statusBarPriority = 1000000;
let workspaceFolder;
let pickedFolder;
let buildMode = utils_1.Builds.debug;
let architectureMode = utils_1.Architectures.x64;
let promiseMessage;
function activate(context) {
    initFolderStatusBar(context);
    if (!vscode.workspace.workspaceFolders ||
        vscode.workspace.workspaceFolders.length === 0) {
        return;
    }
    workspaceFolder = undefined;
    initModeStatusBar(context);
    commandInitDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => initCallback());
    folderStatusBar.command = `${EXTENSION_NAME}.init`;
    context.subscriptions.push(commandInitDisposable);
    commandModeDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.mode`, () => modeCallback());
    modeStatusBar.command = `${EXTENSION_NAME}.mode`;
    context.subscriptions.push(commandModeDisposable);
    workspaceInstance(context);
}
exports.activate = activate;
function initFolderStatusBar(context) {
    folderStatusBar = vscode.window.createStatusBarItem(statusBarAlign, statusBarPriority);
    context.subscriptions.push(folderStatusBar);
    statusBarItems_1.updateFolderStatus(folderStatusBar, taskProvider);
}
function initModeStatusBar(context) {
    modeStatusBar = vscode.window.createStatusBarItem(statusBarAlign, statusBarPriority - 1);
    context.subscriptions.push(modeStatusBar);
    statusBarItems_1.updateModeStatus(modeStatusBar, buildMode, architectureMode);
}
function initCallback() {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = yield workspaceHandler_1.workspaceHandler();
        if (ret && ret.pickedFolder && ret.workspaceFolder) {
            pickedFolder = ret.pickedFolder;
            workspaceFolder = ret.workspaceFolder;
            initWorkspaceInstance();
            if (propertiesProvider && workspaceFolder && pickedFolder) {
                propertiesProvider.workspaceFolder = workspaceFolder;
                propertiesProvider.pickedFolder = pickedFolder;
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
function runCallback() {
    if (!workspaceFolder) {
        if (!promiseMessage) {
            promiseMessage = vscode.window.showErrorMessage("You have to select a folder first.");
        }
    }
    else {
        promiseMessage = undefined;
        taskProvider.getTasks();
        taskHandler_1.taskHandler(taskProvider);
    }
}
function initWorkspaceInstance() {
    if (!workspaceFolder || !pickedFolder) {
        return;
    }
    settingsProvider = new settingsProvider_1.SettingsProvider(workspaceFolder);
    propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspaceFolder, pickedFolder, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspaceFolder, LAUNCH_TEMPLATE, LAUNCH_FILE);
    taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider, pickedFolder, buildMode, architectureMode);
}
function workspaceInstance(context) {
    initWorkspaceInstance();
    deactivateProviderDisposables();
    taskProviderDisposable = vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => runCallback());
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