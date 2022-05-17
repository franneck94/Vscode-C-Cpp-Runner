import * as path from 'path';
import * as vscode from 'vscode';

import { pathExists, readJsonFile } from '../utils/fileUtils';
import { Builds, JsonLaunchConfig } from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';

const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export async function runDebugger(
  activeFolder: string,
  workspaceFolder: string,
  buildMode: Builds,
) {
  const uriWorkspaceFolder = vscode.Uri.file(workspaceFolder);
  const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
  const launchPath = path.join(workspaceFolder, '.vscode', 'launch.json');

  const configJson: JsonLaunchConfig | undefined = readJsonFile(launchPath);

  if (!configJson) return;

  const configIdx = getLaunchConfigIndex(configJson, CONFIG_NAME);

  if (configIdx === undefined) return;

  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  if (!pathExists(modeDir)) return;

  if (
    !configJson.configurations === undefined ||
    !configJson.configurations[configIdx]
  )
    return;

  await vscode.debug.startDebugging(
    folder,
    configJson.configurations[configIdx],
  );
}
