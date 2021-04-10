import * as path from 'path';
import * as vscode from 'vscode';

import { TaskProvider } from '../provider/taskProvider';
import { Architectures, Builds } from '../utils/types';
import { replaceBackslashes } from '../utils/fileUtils';

export function updateFolderStatus(
  status: vscode.StatusBarItem,
  taskProvider: TaskProvider,
  showItem: boolean,
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  if (taskProvider) {
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

  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures,
  showItem: boolean,
) {
  status.text = `$(tools) ${buildMode} - ${architectureMode}`;
  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateBuildStatus(
  status: vscode.StatusBarItem,
  showItem: boolean,
) {
  status.text = `$(gear)`;
  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateRunStatus(
  status: vscode.StatusBarItem,
  showItem: boolean,
) {
  status.text = `$(play)`;
  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateDebugStatus(
  status: vscode.StatusBarItem,
  showItem: boolean,
) {
  status.text = `$(bug)`;
  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateCleanStatus(
  status: vscode.StatusBarItem,
  showItem: boolean,
) {
  status.text = `$(trash)`;
  if (showItem) {
    status.show();
  } else {
    status.hide();
  }
}
