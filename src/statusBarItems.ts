import * as path from "path";
import * as vscode from "vscode";

import { Architectures, Builds } from "./utils";
import { TaskProvider } from "./taskProvider";

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider
) {
  const editor = vscode.window.activeTextEditor;
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  if (taskProvider && taskProvider.pickedFolder) {
    const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
    if (taskProvider.pickedFolder !== workspaceFolder) {
      const workspaceName = path.basename(workspaceFolder);
      status.text = taskProvider.pickedFolder.replace(
        workspaceFolder,
        workspaceName
      );
    } else {
      status.text = taskProvider.pickedFolder;
    }
    status.color = "";
    status.text = status.text.replace(/\\/g, "/");
  } else {
    status.color = "#ffff00";
    status.text = "$(alert) Select folder.";
  }
  status.show();

  if (!editor) {
    return;
  }
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures
) {
  const text = `${buildMode} - ${architectureMode}`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}
