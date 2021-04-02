"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditorInfo = exports.updateModeStatus = exports.updateFolderStatus = void 0;
const path_1 = require("path");
const vscode = require("vscode");
function updateFolderStatus(status) {
    const info = getEditorInfo();
    status.text = info ? info.text || "" : "";
    status.tooltip = info ? info.tooltip : undefined;
    if (info) {
        status.show();
    }
    else {
        status.hide();
    }
    return info ? info.workspacePath : "";
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
function getEditorInfo() {
    const editor = vscode.window.activeTextEditor;
    const workspace = vscode.workspace.workspaceFolders;
    if (!editor || !workspace) {
        return null;
    }
    let text;
    let tooltip;
    let workspacePath;
    const resource = editor.document.uri;
    if (resource.scheme === "file") {
        const folder = vscode.workspace.getWorkspaceFolder(resource);
        if (!folder) {
            text = `$(alert) <outside workspace>`;
        }
        else {
            if (workspace.length > 1) {
                text = `$(file-submodule) ${path_1.basename(folder.uri.fsPath)} (${folder.index + 1} of ${workspace.length})`;
            }
            else {
                text = `$(file-submodule) ${path_1.basename(folder.uri.fsPath)}`;
            }
            tooltip = resource.fsPath;
            workspace.forEach((f) => {
                if (folder.name === f.name) {
                    workspacePath = folder.uri.fsPath;
                }
            });
        }
    }
    return { text, tooltip, workspacePath };
}
exports.getEditorInfo = getEditorInfo;
//# sourceMappingURL=statusBarItems.js.map