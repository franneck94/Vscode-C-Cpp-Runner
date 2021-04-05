import * as path from 'path';
import * as vscode from 'vscode';

import { Architectures, Builds, replaceBackslashes } from '../utils';
import { TaskProvider } from '../provider/taskProvider';

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider,
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  if (taskProvider && taskProvider.pickedFolder) {
    let text;
    const workspaceFolder = taskProvider.propertiesProvider.workspaceFolder;
    const workspaceName = path.basename(workspaceFolder);
    text = taskProvider.pickedFolder.replace(workspaceFolder, workspaceName);
    text = replaceBackslashes(text);
    status.color = '';
    status.text = `$(folder-active) ${text}`;
  } else {
    status.color = '#ffff00';
    status.text = '$(alert) Select folder.';
  }
  status.show();
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures,
) {
  status.text = `$(tools) ${buildMode} - ${architectureMode}`;
  status.show();
}

export function updateBuildStatus(status: vscode.StatusBarItem) {
  status.text = `$(gear)`;
  status.show();
}

export function updateRunStatus(status: vscode.StatusBarItem) {
  status.text = `$(play)`;
  status.show();
}

export function updateDebugStatus(status: vscode.StatusBarItem) {
  status.text = `$(bug)`;
  status.show();
}

export function updateCleanStatus(status: vscode.StatusBarItem) {
  status.text = `$(trash)`;
  status.show();
}
