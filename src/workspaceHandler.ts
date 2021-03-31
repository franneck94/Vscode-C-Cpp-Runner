import * as vscode from "vscode";

export async function workspaceHandler() {
  try {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace) {
      return undefined;
    }

    if (1 === workspace.length) {
      return workspace[0].uri.fsPath;
    }

    let workspaceNames: Array<string> = [];
    workspace.forEach((folder) => {
      workspaceNames.push(folder.name);
    });
    workspaceNames.push("None");

    const pickedWorkspaceName = await vscode.window.showQuickPick(
      workspaceNames,
      {
        placeHolder:
          "Select the workspace folder for the C/C++ Runner extension.",
      }
    );
    let pickedFolder = undefined;

    if (pickedWorkspaceName) {
      workspace.forEach((folder) => {
        if (pickedWorkspaceName === folder.name) {
          pickedFolder = folder.uri.fsPath;
        }
      });
    }

    return pickedFolder;
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }

  return undefined;
}
