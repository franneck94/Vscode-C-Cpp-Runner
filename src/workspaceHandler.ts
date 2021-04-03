import * as path from "path";
import * as vscode from "vscode";
import { getDirectories } from "./utils";

export async function workspaceHandler() {
  const workspaces = vscode.workspace.workspaceFolders;

  if (!workspaces) {
    return;
  }

  const foldersList: string[] = [];
  workspaces.forEach((folder) => {
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
    const folderSplit = pickedFolderStr.split("/");
    const workspaceName = folderSplit[0];
    workspaces.forEach((workspace) => {
      if (workspace.name === workspaceName) {
        workspaceFolder = workspace.uri.fsPath;
      }
    });

    if (workspaceFolder) {
      pickedFolder = path.join(workspaceFolder, ...folderSplit.slice(1));
    }
  }

  return { pickedFolder, workspaceFolder };
}
