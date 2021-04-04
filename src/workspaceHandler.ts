import * as path from "path";
import * as vscode from "vscode";
import { getDirectories, replaceBackslashes } from "./utils";

export async function workspaceHandler() {
  const workspacesFolders = vscode.workspace.workspaceFolders;

  if (!workspacesFolders) {
    return;
  }

  const foldersList: string[] = [];
  workspacesFolders.forEach((folder) => {
    const directories = getDirectories(folder.uri.fsPath);
    if (!directories) {
      return;
    }

    directories.forEach((dir) => {
      let text = dir.replace(folder.uri.fsPath, folder.name);
      text = replaceBackslashes(text);
      foldersList.push(text);
    });
  });

  const pickedFolderStr = await vscode.window.showQuickPick(foldersList, {
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
}
