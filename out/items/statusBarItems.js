"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCleanStatus = exports.updateDebugStatus = exports.updateRunStatus = exports.updateBuildStatus = exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
function updateFolderStatus(status, taskProvider, showItem) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    if (taskProvider && taskProvider.activeFolder) {
        let text;
        const workspaceFolder = taskProvider.workspaceFolder;
        const workspaceName = path.basename(workspaceFolder);
        text = taskProvider.activeFolder.replace(workspaceFolder, workspaceName);
        text = utils_1.replaceBackslashes(text);
        status.color = '';
        status.text = `$(folder-active) ${text}`;
    }
    else {
        status.color = '#ffff00';
        status.text = '$(alert) Select folder.';
    }
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateFolderStatus = updateFolderStatus;
function updateModeStatus(status, buildMode, architectureMode, showItem) {
    status.text = `$(tools) ${buildMode} - ${architectureMode}`;
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateModeStatus = updateModeStatus;
function updateBuildStatus(status, showItem) {
    status.text = `$(gear)`;
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateBuildStatus = updateBuildStatus;
function updateRunStatus(status, showItem) {
    status.text = `$(play)`;
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateRunStatus = updateRunStatus;
function updateDebugStatus(status, showItem) {
    status.text = `$(bug)`;
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateDebugStatus = updateDebugStatus;
function updateCleanStatus(status, showItem) {
    status.text = `$(trash)`;
    if (showItem) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateCleanStatus = updateCleanStatus;
//# sourceMappingURL=statusBarItems.js.map