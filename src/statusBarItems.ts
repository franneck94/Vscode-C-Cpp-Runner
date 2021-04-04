import * as path from "path";
import * as vscode from "vscode";

import { Architectures, Builds, replaceBackslashes } from "./utils";
import { TaskProvider } from "./taskProvider";

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  if (taskProvider && taskProvider.pickedFolder) {
    let text;
    const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
    if (taskProvider.pickedFolder !== workspaceFolder) {
      const workspaceName = path.basename(workspaceFolder);
      text = taskProvider.pickedFolder.replace(
        workspaceFolder,
        workspaceName
      );
    } else {
      text = taskProvider.pickedFolder;
    }
    text = replaceBackslashes(text);
    status.color = "";
    status.text = `$(folder-active) ${text}`;
  } else {
    status.color = "#ffff00";
    status.text = "$(alert) Select folder.";
  }
  status.show();
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures
) {
  const text = `$(tools) ${buildMode} - ${architectureMode}`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateBuildStatus(
  status: vscode.StatusBarItem
) {
  const text = `$(gear)`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateRunStatus(
  status: vscode.StatusBarItem
) {
  const text = `$(play)`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateDebugStatus(
  status: vscode.StatusBarItem
) {
  const text = `$(bug)`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateCleanStatus(
  status: vscode.StatusBarItem
) {
  const text = `$(trash)`;
  status.text = text;

  if (text) {
    status.show();
  } else {
    status.hide();
  }
}
