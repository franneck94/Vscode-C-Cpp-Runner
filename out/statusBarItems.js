"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path = require("path");
const vscode = require("vscode");
function updateFolderStatus(status, taskProvider) {
    var _a;
    const editor = vscode.window.activeTextEditor;
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace) {
        return undefined;
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
    }
    else {
        status.text = "Select folder.";
    }
    status.show();
    if (!editor) {
        return "";
    }
    const resource = editor.document.uri;
    let folder = "";
    if (resource.scheme === "file") {
        folder = (_a = vscode.workspace.getWorkspaceFolder(resource)) === null || _a === void 0 ? void 0 : _a.name;
    }
    return folder ? folder : "";
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