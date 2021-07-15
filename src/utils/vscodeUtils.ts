import * as path from 'path';
import * as vscode from 'vscode';

import { extensionState } from '../extension';
import { filesInDir, pathExists, readJsonFile } from './fileUtils';
import { JsonConfiguration, JsonSettings } from './types';

const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;

export function disposeItem(disposableItem: vscode.Disposable | undefined) {
  if (disposableItem) {
    disposableItem.dispose();
  }
}

export function createStatusBarItem() {
  return vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
}

export function setContextValue(key: string, value: any): Thenable<void> {
  return vscode.commands.executeCommand('setContext', key, value);
}

export function getLaunchConfigIndex(
  configJson: JsonConfiguration,
  configName: string,
) {
  let configIdx = 0;

  if (configJson) {
    for (const config of configJson.configurations) {
      if (config.name !== configName) {
        configIdx++;
      } else {
        return configIdx;
      }
    }
  }

  return undefined;
}

export function updateLoggingState() {
  if (extensionState) {
    extensionState.update(
      'loggingActive',
      vscode.workspace
        .getConfiguration('C_Cpp_Runner')
        .get('loggingActive', false),
    );
  }
}

export function getExperimentalExecutionState() {
  return vscode.workspace
    .getConfiguration('C_Cpp_Runner')
    .get('experimentalExecution', false);
}

export function getLoggingState() {
  if (extensionState) {
    return <boolean>extensionState.get('loggingActive');
  }

  return false;
}

export function isCmakeActive() {
  let cmakeActive = false;

  const workspaceFodlers = vscode.workspace.workspaceFolders;
  const cmakeExtensionName = 'cmake';
  const cmakeSettingName = 'sourceDirectory';

  if (workspaceFodlers) {
    workspaceFodlers.forEach((folder) => {
      if (!cmakeActive) {
        const files = filesInDir(folder.uri.fsPath);
        files.forEach((file) => {
          if (file.toLowerCase() === 'CMakeLists.txt'.toLowerCase()) {
            cmakeActive = true;
          }
        });

        const settingsPath = path.join(
          folder.uri.fsPath,
          '.vscode',
          'settings.json',
        );

        if (pathExists(settingsPath)) {
          const configLocal: JsonSettings | undefined = readJsonFile(
            settingsPath,
          );

          if (
            configLocal &&
            configLocal[`${cmakeExtensionName}.${cmakeSettingName}`]
          ) {
            cmakeActive = true;
          }
        }
      }
    });
  }

  if (!cmakeActive) {
    const config = vscode.workspace.getConfiguration(cmakeExtensionName);
    const cmakeSetting = config.get(cmakeSettingName);

    if (cmakeSetting && cmakeSetting !== '${workspaceFolder}') {
      cmakeActive = true;
    }
  }

  return cmakeActive;
}

export function isMakeActive() {
  let makeActive = false;

  const workspaceFodlers = vscode.workspace.workspaceFolders;
  const makeExtensionName = 'makefile';
  const makeSettingName = 'makefilePath';

  if (workspaceFodlers) {
    workspaceFodlers.forEach((folder) => {
      if (!makeActive) {
        const files = filesInDir(folder.uri.fsPath);
        files.forEach((file) => {
          if (file.toLowerCase() === 'Makefile'.toLowerCase()) {
            makeActive = true;
          }
        });

        const vscodePath = path.join(folder.uri.fsPath, '.vscode');
        const makefilePath = path.join(vscodePath, 'Makefile');
        const settingsPath = path.join(vscodePath, 'settings.json');

        if (pathExists(settingsPath)) {
          const configLocal: JsonSettings | undefined = readJsonFile(
            settingsPath,
          );

          if (
            configLocal &&
            configLocal[`${makeExtensionName}.${makeSettingName}`]
          ) {
            makeActive = true;
          }
        }

        if (pathExists(makefilePath)) {
          makeActive = true;
        }
      }
    });
  }

  if (!makeActive) {
    const config = vscode.workspace.getConfiguration(makeExtensionName);
    const makeSetting = config.get(makeSettingName);

    if (makeSetting) {
      makeActive = true;
    }
  }

  return makeActive;
}
