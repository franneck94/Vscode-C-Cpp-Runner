import * as path from 'path';
import * as vscode from 'vscode';

import { getActivationState } from '../utils/vscodeUtils';

export abstract class CallbackProvider {
  protected _outputPath: string;
  protected _vscodeDirectory: string;
  protected _fileWatcherOnDelete: vscode.FileSystemWatcher | undefined;
  protected _fileWatcherOnChange: vscode.FileSystemWatcher | undefined;

  constructor(
    protected _workspaceFolder: string,
    protected templateFileName: string | undefined,
    protected outputFileName: string,
  ) {
    this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, outputFileName);

    this.createFileWatcher();
  }

  protected createFileWatcher() {
    const filePattern = new vscode.RelativePattern(
      this._workspaceFolder,
      '.vscode/**',
    );

    this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      filePattern,
      true,
      true,
      false,
    );

    this._fileWatcherOnChange = vscode.workspace.createFileSystemWatcher(
      filePattern,
      true,
      false,
      true,
    );

    this._fileWatcherOnDelete.onDidDelete((e: vscode.Uri) => {
      const pathName = e.fsPath;
      if (pathName === this._vscodeDirectory || pathName === this._outputPath) {
        const extensionIsActive = getActivationState();
        if (extensionIsActive) this.deleteCallback();
      }
    });

    this._fileWatcherOnChange.onDidChange((e: vscode.Uri) => {
      const pathName = e.fsPath;
      if (pathName === this._outputPath) {
        this.changeCallback();
      }
    });

    return;
  }

  public abstract deleteCallback(): void;

  public abstract changeCallback(): void;
}
