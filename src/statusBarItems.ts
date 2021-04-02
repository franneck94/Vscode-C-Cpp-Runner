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
    return undefined;
  }

  if (taskProvider && taskProvider.pickedFolder) {
    const workspacePath = taskProvider.propertiesProvider.workspacePath;
    if (taskProvider.pickedFolder !== workspacePath) {
      const workspaceName = path.basename(workspacePath);
      status.text = taskProvider.pickedFolder.replace(workspacePath, workspaceName);
    } else {
      status.text = taskProvider.pickedFolder;
    }
  } else {
    status.text = "Select folder.";
  }
  status.show();

  if (!editor) {
    return "";
  }

  const resource = editor.document.uri;
  let folder: string | undefined = "";
  if (resource.scheme === "file") {
    folder = vscode.workspace.getWorkspaceFolder(resource)?.name;
  }

  return folder ? folder : "";
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures
) {
  const info = {
    text: `${buildMode} - ${architectureMode}`,
    tooltip: "tooltip",
  };
  status.text = info.text;
  status.tooltip = info.tooltip;

  if (info) {
    status.show();
  } else {
    status.hide();
  }
}
