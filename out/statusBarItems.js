"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = require("path");
const vscode = require("vscode");
function updateFolderStatus(status, taskProvider) {
    const editor = vscode.window.activeTextEditor;
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace) {
        return;
    }
    if (taskProvider && taskProvider.pickedFolder) {
        const workspacePath = taskProvider.propertiesProvider.workspacePath;
        if (taskProvider.pickedFolder !== workspacePath) {
            const workspaceName = path.basename(workspacePath);
            status.text = taskProvider.pickedFolder.replace(workspacePath, workspaceName);
        }
        else {
            status.text = taskProvider.pickedFolder;
        }
        status.text = status.text.replace("\\", "/");
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
    const info = {
        text: `${buildMode} - ${architectureMode}`,
        tooltip: "tooltip",
    };
    status.text = info.text;
    status.tooltip = info.tooltip;
    if (info) {
        status.show();
    }
    else {
        status.hide();
    }
}
exports.updateModeStatus = updateModeStatus;
//# sourceMappingURL=statusBarItems.js.map