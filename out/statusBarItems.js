"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCleanStatus = exports.updateDebugStatus = exports.updateRunStatus = exports.updateBuildStatus = exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
function updateFolderStatus(status, taskProvider) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    if (taskProvider && taskProvider.pickedFolder) {
        let text;
        const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
        if (taskProvider.pickedFolder !== workspaceFolder) {
            const workspaceName = path.basename(workspaceFolder);
            text = taskProvider.pickedFolder.replace(workspaceFolder, workspaceName);
        }
        else {
            text = taskProvider.pickedFolder;
        }
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
    const text = `$(tools) ${buildMode} - ${architectureMode}`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateModeStatus = updateModeStatus;
function updateBuildStatus(status) {
    const text = `$(gear)`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateBuildStatus = updateBuildStatus;
function updateRunStatus(status) {
    const text = `$(play)`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateRunStatus = updateRunStatus;
function updateDebugStatus(status) {
    const text = `$(bug)`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateDebugStatus = updateDebugStatus;
function updateCleanStatus(status) {
    const text = `$(trash)`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateCleanStatus = updateCleanStatus;
//# sourceMappingURL=statusBarItems.js.map