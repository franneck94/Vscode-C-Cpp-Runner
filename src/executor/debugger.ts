import * as path from 'path';
import * as vscode from 'vscode';

import { DEBUG_CONFIG_NAME } from '../params/params';
import { SettingsProvider } from '../provider/settingsProvider';
import { Builds } from '../types/enums';
import { JsonLaunchConfig } from '../types/interfaces';
import { getBuildModeDir, pathExists, readJsonFile } from '../utils/fileUtils';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { getExecutableName } from './builder';

export async function runDebugger(
  activeFolder: string,
  workspaceFolder: string,
  buildMode: Builds,
  settingsProvider: SettingsProvider,
) {
  const uriWorkspaceFolder = vscode.Uri.file(workspaceFolder);
  const folder = vscode.workspace.getWorkspaceFolder(uriWorkspaceFolder);
  const launchPath = path.join(workspaceFolder, '.vscode', 'launch.json');

  const configJson: JsonLaunchConfig | undefined = readJsonFile(launchPath);

  if (!configJson) return;

  const configIdx = getLaunchConfigIndex(configJson, DEBUG_CONFIG_NAME);

  if (configIdx === undefined) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);
  const executableName = getExecutableName(
    settingsProvider.operatingSystem,
    buildMode,
  );
  const executablePath = path.join(modeDir, executableName);

  if (!pathExists(modeDir) || !pathExists(executablePath)) return;

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
