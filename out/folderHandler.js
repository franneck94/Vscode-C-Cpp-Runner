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
exports.folderHandler = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
function folderHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        const workspacesFolders = vscode.workspace.workspaceFolders;
        if (!workspacesFolders) {
            return;
        }
        const foldersList = [];
        workspacesFolders.forEach((folder) => {
            const directories = [folder.name];
            const recursiveDirectories = utils_1.getDirectories(folder.uri.fsPath);
            if (!recursiveDirectories) {
                return;
            }
            directories.push(...recursiveDirectories);
            directories.forEach((dir) => {
                let text = dir.replace(folder.uri.fsPath, folder.name);
                text = utils_1.replaceBackslashes(text);
                foldersList.push(text);
            });
        });
        const pickedFolderStr = yield vscode.window.showQuickPick(foldersList, {
            placeHolder: "Select workspace folder to init the C/C++ Runner extension.",
        });
        let pickedFolder;
        let workspaceFolder;
        if (pickedFolderStr) {
            const folderSplit = pickedFolderStr.split("/");
            const workspaceName = folderSplit[0];
            workspacesFolders.forEach((folder) => {
                if (folder.name === workspaceName) {
                    workspaceFolder = folder.uri.fsPath;
                }
            });
            if (workspaceFolder) {
                pickedFolder = path.join(workspaceFolder, ...folderSplit.slice(1));
            }
        }
        return { pickedFolder, workspaceFolder };
    });
}
exports.folderHandler = folderHandler;
//# sourceMappingURL=folderHandler.js.map