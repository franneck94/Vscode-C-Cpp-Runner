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
const utils_1 = require("./utils");
function workspaceHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workspace = vscode.workspace.workspaceFolders;
            if (!workspace) {
                return;
            }
            const foldersList = [];
            workspace.forEach((folder) => {
                const directories = utils_1.getDirectories(folder.uri.fsPath);
                if (!directories) {
                    return;
                }
                directories.forEach((dir) => {
                    let text = dir.replace(folder.uri.fsPath, folder.name);
                    text = text.replace(/\\/g, "/");
                    foldersList.push(text);
                });
            });
            const pickedFolderStr = yield vscode.window.showQuickPick(foldersList, {
                placeHolder: "Select workspace folder to init the C/C++ Runner extension.",
            });
            let pickedFolder;
            let workspaceFolder;
            if (pickedFolderStr) {
                // TODO: Get workspace folder by first folder name in foldersList
                // TODO:  also pickedFolder is join of workspace and folder name i nfolderList
                // foldersList.forEach((folder) => {
                //   const directories = getDirectories(folder.uri.fsPath);
                //   if (!directories) {
                //     return;
                //   }
                //   if (pickedFolderStr === folder.name) {
                //     pickedFolder = folder.uri.fsPath;
                //     workspaceFolder = folder.uri.fsPath;
                //   }
                //   directories.forEach((dir) => {
                //     if (pickedFolderStr === `${folder.name}/${dir}`) {
                //       pickedFolder = path.join(folder.uri.fsPath, dir);
                //       workspaceFolder = folder.uri.fsPath;
                //     }
                //   });
                // });
            }
            return { pickedFolder, workspaceFolder };
        }
        catch (err) {
            vscode.window.showInformationMessage(err);
        }
        return undefined;
    });
}
exports.workspaceHandler = workspaceHandler;
//# sourceMappingURL=workspaceHandler.js.map