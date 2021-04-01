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
exports.workspaceHandler = exports.getEditorInfo = exports.updateStatus = void 0;
const path_1 = require("path");
const vscode = require("vscode");
function updateStatus(status) {
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
exports.updateStatus = updateStatus;
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
function workspaceHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workspace = vscode.workspace.workspaceFolders;
            if (!workspace) {
                return undefined;
            }
            if (1 === workspace.length) {
                return workspace[0].uri.fsPath;
            }
            let workspaceNames = [];
            workspace.forEach((folder) => {
                workspaceNames.push(folder.name);
            });
            const pickedWorkspaceName = yield vscode.window.showQuickPick(workspaceNames, {
                placeHolder: "Select workspace folder to init the C/C++ Runner extension.",
            });
            let pickedFolder = undefined;
            if (pickedWorkspaceName) {
                workspace.forEach((folder) => {
                    if (pickedWorkspaceName === folder.name) {
                        pickedFolder = folder.uri.fsPath;
                    }
                });
            }
            return pickedFolder;
        }
        catch (err) {
            vscode.window.showInformationMessage(err);
        }
        return undefined;
    });
}
exports.workspaceHandler = workspaceHandler;
//# sourceMappingURL=workspaceHandler.js.map