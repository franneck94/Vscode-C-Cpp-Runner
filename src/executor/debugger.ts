import * as path from 'path';
import * as vscode from 'vscode';

import { DEBUG_CONFIG_NAME } from '../params/params';
import { Builds } from '../types/enums';
import { JsonLaunchConfig } from '../types/interfaces';
import { getBuildModeDir, pathExists, readJsonFile } from '../utils/fileUtils';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';

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

  const configIdx = getLaunchConfigIndex(configJson, DEBUG_CONFIG_NAME);

  if (configIdx === undefined) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);

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
