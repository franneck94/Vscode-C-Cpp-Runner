import * as vscode from 'vscode';
import { extensionContextState } from '../extension';
import { JsonConfiguration } from './types';

const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;

export function disposeItem(disposableItem: vscode.Disposable) {
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
    configJson.configurations.forEach((config) => {
      if (config.name !== configName) {
        configIdx++;
      }
    });
  }

  return configIdx;
}

export function updateLoggingState() {
  if (extensionContextState) {
    extensionContextState.update(
      'loggingActive',
      vscode.workspace
        .getConfiguration('C_Cpp_Runner')
        .get('loggingActive', false),
    );
  }
}

export function getLoggingState() {
  if (extensionContextState) {
    return <boolean>extensionContextState.get('loggingActive');
  }

  return false;
}
