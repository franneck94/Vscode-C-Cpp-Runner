import * as path from 'path';
import * as vscode from 'vscode';

import { TaskProvider } from '../provider/taskProvider';
import { Architectures, Builds } from '../utils/types';
import { replaceBackslashes } from '../utils/fileUtils';

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider,
  showStatusBarItems: boolean,
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  if (
    taskProvider &&
    taskProvider.workspaceFolder &&
    taskProvider.activeFolder
  ) {
    const workspaceFolder = taskProvider.workspaceFolder;
    const workspaceName = path.basename(workspaceFolder);
    let text = taskProvider.activeFolder.replace(
      workspaceFolder,
      workspaceName,
    );
    text = replaceBackslashes(text);
    status.color = '';
    status.text = `$(folder-active) ${text}`;
  } else {
    status.color = '#ffff00';
    status.text = '$(alert) Select folder.';
  }

  if (showStatusBarItems) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
  buildMode: Builds,
  architectureMode: Architectures,
) {
  status.color = '';
  status.text = `$(tools) ${buildMode} - ${architectureMode}`;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateBuildStatus(
  status: vscode.StatusBarItem,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  status.color = '';
  status.text = `$(gear)`;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateRunStatus(
  status: vscode.StatusBarItem,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  status.color = '';
  status.text = `$(play)`;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateDebugStatus(
  status: vscode.StatusBarItem,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  status.color = '';
  status.text = `$(bug)`;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateCleanStatus(
  status: vscode.StatusBarItem,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  status.color = '';
  status.text = `$(trash)`;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}
