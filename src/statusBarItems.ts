import * as path from "path";
import * as vscode from "vscode";

import { Architectures, Builds } from "./utils";
import { TaskProvider } from "./taskProvider";

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider
) {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace.workspaceFolders;

  if (!workspace) {
    return;
  }

  if (taskProvider && taskProvider.pickedFolder) {
    const workspacePath = taskProvider.propertiesProvider.workspacePath;
    if (taskProvider.pickedFolder !== workspacePath) {
      const workspaceName = path.basename(workspacePath);
      status.text = taskProvider.pickedFolder.replace(
        workspacePath,
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
