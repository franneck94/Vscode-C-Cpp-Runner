"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderHandler = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
async function folderHandler() {
    const workspacesFolders = vscode.workspace.workspaceFolders;
    if (!workspacesFolders) {
        return;
    }
    const foldersList = [];
    workspacesFolders.forEach((folder) => {
        const directories = [folder.name];
        const recursiveDirectories = utils_1.getDirectories(folder.uri.fsPath);
        if (recursiveDirectories) {
            directories.push(...recursiveDirectories);
        }
        directories.forEach((dir) => {
            let text = dir.replace(folder.uri.fsPath, folder.name);
            text = utils_1.replaceBackslashes(text);
            foldersList.push(text);
        });
    });
    const pickedFolderStr = await vscode.window.showQuickPick(foldersList, {
        placeHolder: 'Select workspace folder to init the C/C++ Runner extension.',
    });
    let activeFolder;
    let workspaceFolder;
    if (pickedFolderStr) {
        const folderSplit = pickedFolderStr.split('/');
        const workspaceName = folderSplit[0];
        workspacesFolders.forEach((folder) => {
            if (folder.name === workspaceName) {
                workspaceFolder = folder.uri.fsPath;
            }
        });
        if (workspaceFolder) {
            activeFolder = path.join(workspaceFolder, ...folderSplit.slice(1));
        }
    }
    return { activeFolder, workspaceFolder };
}
exports.folderHandler = folderHandler;
//# sourceMappingURL=folderHandler.js.map