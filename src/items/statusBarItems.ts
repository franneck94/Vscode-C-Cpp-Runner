import * as path from 'path';
import * as vscode from 'vscode';

import { Builds } from '../types/enums';
import { replaceBackslashes } from '../utils/fileUtils';

export function updateFolderStatus(
  status: vscode.StatusBarItem | undefined,
  workspaceFolder: string | undefined,
  activeFolder: string | undefined,
  showStatusBarItems: boolean,
) {
  if (!status) return;

  if (workspaceFolder && activeFolder) {
    const workspaceName = path.basename(workspaceFolder);
    let text = activeFolder.replace(workspaceFolder, workspaceName);

    text = replaceBackslashes(text);
    const dirs = text.split('/');

    if (dirs.length > 2) {
      const lastElement = dirs.length - 1;
      text = `${dirs[0]}/.../${dirs[lastElement]}`;
    }

    status.backgroundColor = '';
    status.text = `$(folder-active) ${text}`;
  } else {
    status.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground',
    );
    status.text = '$(alert) Select folder.';
  }

  if (showStatusBarItems) {
    status.show();
  } else {
    status.hide();
  }
}

export function updateModeStatus(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
  buildMode: Builds,
) {
  if (!status) return;

  status.text = `$(tools) ${buildMode}`;
  toggleShow(status, showStatusBarItems, activeFolder);
}

export function updateBuildStatus(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  if (!status) return;

  status.text = `$(gear)`;
  toggleShow(status, showStatusBarItems, activeFolder);
}

export function updateRunStatus(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  if (!status) return;

  status.text = `$(play)`;
  toggleShow(status, showStatusBarItems, activeFolder);
}

export function updateDebugStatus(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  if (!status) return;

  status.text = `$(bug)`;
  toggleShow(status, showStatusBarItems, activeFolder);
}

export function updateCleanStatus(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  if (!status) return;

  status.text = `$(trash)`;
  toggleShow(status, showStatusBarItems, activeFolder);
}

function toggleShow(
  status: vscode.StatusBarItem | undefined,
  showStatusBarItems: boolean,
  activeFolder: string | undefined,
) {
  if (!status) return;

  if (showStatusBarItems && activeFolder) {
    status.show();
  } else {
    status.hide();
  }
}
