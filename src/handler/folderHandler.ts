import * as minimatch from 'minimatch';
import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import {
	getDirectoriesRecursive,
	naturalSort,
	replaceBackslashes,
} from '../utils/fileUtils';

export async function folderHandler(
  settingsProvider: SettingsProvider | undefined,
) {
  const workspacesFolders = vscode.workspace.workspaceFolders;

  if (!workspacesFolders) return;

  let foldersList: string[] = [];
  workspacesFolders.forEach((folder) => {
    const directories = [folder.name];
    const recursiveDirectories = getDirectoriesRecursive(folder.uri.fsPath);
    if (recursiveDirectories) {
      directories.push(...recursiveDirectories);
    }

    directories.forEach((dir) => {
      let text = dir.replace(folder.uri.fsPath, folder.name);
      text = replaceBackslashes(text);
      foldersList.push(text);
    });

    if (settingsProvider) {
      for (const pattern of settingsProvider.excludeSearch) {
        foldersList = foldersList.filter(
          (folder) => !minimatch(folder, pattern),
        );
      }
    }

    foldersList = naturalSort(foldersList);
  });

  const activeFolderStr = await vscode.window.showQuickPick(foldersList, {
    placeHolder: 'Select folder to init the C/C++ Runner extension.',
  });
  let activeFolder: string | undefined;
  let workspaceFolder: string | undefined;

  if (activeFolderStr) {
    const folderSplit = activeFolderStr.split('/');
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
