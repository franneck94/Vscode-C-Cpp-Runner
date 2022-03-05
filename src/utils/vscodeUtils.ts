import * as path from 'path';
import * as vscode from 'vscode';

import { extensionState } from '../extension';
import { filesInDir, pathExists, readJsonFile } from './fileUtils';
import { JsonConfiguration, JsonSettings, OperatingSystems } from './types';

const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;

export function disposeItem(disposableItem: vscode.Disposable | undefined) {
  disposableItem?.dispose();
}

export function createStatusBarItem() {
  return vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
}

export function setContextValue(key: string, value: any) {
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
  extensionState?.update(
    'loggingActive',
    vscode.workspace
      .getConfiguration('C_Cpp_Runner')
      .get('loggingActive', false),
  );
}

export function updateActivationState(newState: boolean) {
  extensionState?.update('activatedExtension', newState);
}

export function getLoggingState() {
  if (extensionState) {
    const loggingActive = <boolean>extensionState.get('loggingActive');
    return loggingActive;
  }

  return false;
}

export function getActivationState() {
  if (extensionState) {
    return <boolean>extensionState.get('activatedExtension');
  }

  return false;
}

export function isCmakeProject() {
  let cmakeFileFound = false;

  const workspaceFodlers = vscode.workspace.workspaceFolders;
  const cmakeExtensionName = 'cmake';
  const cmakeSettingName = 'sourceDirectory';

  if (workspaceFodlers) {
    workspaceFodlers.forEach((folder) => {
      if (!cmakeFileFound) {
        const files = filesInDir(folder.uri.fsPath);
        files.forEach((file) => {
          if (file.toLowerCase() === 'CMakeLists.txt'.toLowerCase()) {
            cmakeFileFound = true;
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
            cmakeFileFound = true;
          }
        }
      }
    });
  }

  if (!cmakeFileFound) {
    const config = vscode.workspace.getConfiguration(cmakeExtensionName);
    const cmakeSetting = config.get(cmakeSettingName);

    if (cmakeSetting && cmakeSetting !== '${workspaceFolder}') {
      cmakeFileFound = true;
    }
  }

  return cmakeFileFound;
}

export function getProcessExection(
  operatingSystem: OperatingSystems,
  commandLine: string,
  activeFolder: string,
) {
  const options = {
    cwd: activeFolder,
  };

  let execution: vscode.ProcessExecution | undefined;
  if (operatingSystem === OperatingSystems.windows) {
    execution = new vscode.ProcessExecution(
      'C:/Windows/System32/cmd.exe',
      ['/d', '/c', commandLine],
      options,
    );
  } else {
    let standard_shell = process.env['SHELL'];
    if (!standard_shell) {
      standard_shell = '/bin/bash';
    }
    execution = new vscode.ProcessExecution(
      standard_shell,
      ['-c', commandLine],
      options,
    );
  }

  return execution;
}
