import * as path from "path";
import * as vscode from "vscode";
import { getDirectories } from "./utils";

export async function workspaceHandler() {
  try {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace) {
      return;
    }

    const foldersList: string[] = [];
    workspace.forEach((folder) => {
      const directories = getDirectories(folder.uri.fsPath);
      if (!directories) {
        return;
      }

      directories.forEach((dir) => {
        let text = dir.replace(folder.uri.fsPath, folder.name);
        text = text.replace(/\\/g, "/");
        foldersList.push(text);
      });
    });

    const pickedFolderStr = await vscode.window.showQuickPick(foldersList, {
      placeHolder:
        "Select workspace folder to init the C/C++ Runner extension.",
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
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }

  return undefined;
}
