import * as vscode from 'vscode';

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
