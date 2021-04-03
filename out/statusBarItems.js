"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = require("path");
const vscode = require("vscode");
function updateFolderStatus(status, taskProvider) {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    if (taskProvider && taskProvider.pickedFolder) {
        const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
        if (taskProvider.pickedFolder !== workspaceFolder) {
            const workspaceName = path.basename(workspaceFolder);
            status.text = taskProvider.pickedFolder.replace(workspaceFolder, workspaceName);
        }
        else {
            status.text = taskProvider.pickedFolder;
        }
        status.color = "";
        status.text = status.text.replace(/\\/g, "/");
    }
    else {
        status.color = "#ffff00";
        status.text = "$(alert) Select folder.";
    }
    status.show();
    if (!editor) {
        return;
    }
}
exports.updateFolderStatus = updateFolderStatus;
function updateModeStatus(status, buildMode, architectureMode) {
    const text = `${buildMode} - ${architectureMode}`;
    status.text = text;
    if (text) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateModeStatus = updateModeStatus;
//# sourceMappingURL=statusBarItems.js.map