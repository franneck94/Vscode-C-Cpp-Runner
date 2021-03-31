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
exports.workspaceHandler = void 0;
const vscode = require("vscode");
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
            workspaceNames.push("None");
            const pickedWorkspaceName = yield vscode.window.showQuickPick(workspaceNames, {
                placeHolder: "Select the workspace folder for the C/C++ Runner extension.",
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