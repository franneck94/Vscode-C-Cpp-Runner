import * as path from 'path';
import * as vscode from 'vscode';

import { Builds, JsonLaunchConfig } from '../types/types';
import { pathExists, readJsonFile } from '../utils/fileUtils';
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
    !configJson.configurations[configIdx] === undefined
  )
    return;

  await vscode.debug.startDebugging(
    folder,
    configJson.configurations[configIdx] as vscode.DebugConfiguration,
  );
}
