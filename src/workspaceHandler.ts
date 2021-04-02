import * as vscode from "vscode";

export async function workspaceHandler() {
  try {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace) {
      return undefined;
    }

    if (workspace.length === 1) {
      return workspace[0].uri.fsPath;
    }

    const workspaceNames: string[] = [];
    workspace.forEach((folder) => {
      workspaceNames.push(folder.name);
    });

    const pickedWorkspaceName = await vscode.window.showQuickPick(
      workspaceNames,
      {
        placeHolder:
          "Select workspace folder to init the C/C++ Runner extension.",
      }
    );
    let pickedFolder;

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
