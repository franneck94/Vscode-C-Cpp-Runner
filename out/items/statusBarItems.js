"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCleanStatus = exports.updateDebugStatus = exports.updateRunStatus = exports.updateBuildStatus = exports.updateModeStatus = exports.updateFolderStatus = exports.initStatusBarItem = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
const EXTENSION_NAME = "C_Cpp_Runner";
const statusBarAlign = vscode.StatusBarAlignment.Left;
function initStatusBarItem(context, statusBarItem, priority, commandName, commandDisposable, updateCallback, commandCallback, ...args) {
    statusBarItem = vscode.window.createStatusBarItem(statusBarAlign, priority);
    context.subscriptions.push(statusBarItem);
    updateCallback(statusBarItem, ...args);
    commandDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.${commandName}`, () => commandCallback(...args));
    statusBarItem.command = `${EXTENSION_NAME}.${commandName}`;
    context.subscriptions.push(commandDisposable);
    return { statusBarItem, commandDisposable };
}
exports.initStatusBarItem = initStatusBarItem;
function updateFolderStatus(status, taskProvider) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    if (taskProvider && taskProvider.pickedFolder) {
        let text;
        const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
        const workspaceName = path.basename(workspaceFolder);
        text = taskProvider.pickedFolder.replace(workspaceFolder, workspaceName);
        text = utils_1.replaceBackslashes(text);
        status.color = "";
        status.text = `$(folder-active) ${text}`;
    }
    else {
        status.color = "#ffff00";
        status.text = "$(alert) Select folder.";
    }
    status.show();
}
exports.updateFolderStatus = updateFolderStatus;
function updateModeStatus(status, buildMode, architectureMode) {
    status.text = `$(tools) ${buildMode} - ${architectureMode}`;
    status.show();
}
exports.updateModeStatus = updateModeStatus;
function updateBuildStatus(status) {
    status.text = `$(gear)`;
    status.show();
}
exports.updateBuildStatus = updateBuildStatus;
function updateRunStatus(status) {
    status.text = `$(play)`;
    status.show();
}
exports.updateRunStatus = updateRunStatus;
function updateDebugStatus(status) {
    status.text = `$(bug)`;
    status.show();
}
exports.updateDebugStatus = updateDebugStatus;
function updateCleanStatus(status) {
    status.text = `$(trash)`;
    status.show();
}
exports.updateCleanStatus = updateCleanStatus;
//# sourceMappingURL=statusBarItems.js.map