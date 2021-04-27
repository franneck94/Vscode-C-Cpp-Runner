import * as path from 'path';
import * as vscode from 'vscode';

import {
  getDirectories,
  naturalSort,
  replaceBackslashes,
} from '../utils/fileUtils';

export async function folderHandler() {
  const workspacesFolders = vscode.workspace.workspaceFolders;

  if (!workspacesFolders) return;

  let foldersList: string[] = [];
  workspacesFolders.forEach((folder) => {
    const directories = [folder.name];
    const recursiveDirectories = getDirectories(folder.uri.fsPath);
    if (recursiveDirectories) {
      directories.push(...recursiveDirectories);
    }

    directories.forEach((dir) => {
      let text = dir.replace(folder.uri.fsPath, folder.name);
      text = replaceBackslashes(text);
      foldersList.push(text);
    });
    foldersList = naturalSort(foldersList);
  });

  const pickedFolderStr = await vscode.window.showQuickPick(foldersList, {
    placeHolder: 'Select folder to init the C/C++ Runner extension.',
  });
  let activeFolder: string | undefined;
  let workspaceFolder: string | undefined;

  if (pickedFolderStr) {
    const folderSplit = pickedFolderStr.split('/');
    const workspaceName = folderSplit[0];
    workspacesFolders.forEach((folder) => {
      if (folder.name === workspaceName) {
        workspaceFolder = folder.uri.fsPath;
      }
    });

    if (workspaceFolder) {
      activeFolder = path.join(workspaceFolder, ...folderSplit.slice(1));
    }
  }

  return { activeFolder, workspaceFolder };
}
