import * as path from 'path';
import * as vscode from 'vscode';

import { pathExists, readJsonFile } from '../utils/fileUtils';
import { Builds, JsonConfiguration } from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';

const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export async function runDebugger(
  activeFolder: string | undefined,
  workspaceFolder: string | undefined,
  buildMode: Builds,
) {
  if (!activeFolder) return;
  if (!workspaceFolder) return;

  const uriWorkspaceFolder = vscode.Uri.file(workspaceFolder);
  const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
  const launchPath = path.join(workspaceFolder, '.vscode', 'launch.json');

  const configJson: JsonConfiguration | undefined = readJsonFile(launchPath);

  if (!configJson) return;

  const configIdx = getLaunchConfigIndex(configJson, CONFIG_NAME);

  if (configIdx === undefined) return;

  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);
  if (!pathExists(modeDir)) return;

  await vscode.debug.startDebugging(
    folder,
    configJson.configurations[configIdx],
  );
}
