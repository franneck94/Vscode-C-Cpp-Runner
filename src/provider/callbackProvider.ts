import * as path from 'path';
import * as vscode from 'vscode';

export abstract class CallbackProvider {
  protected _outputPath: string;
  protected _vscodeDirectory: string;
  protected _fileWatcherOnDelete: vscode.FileSystemWatcher | undefined;
  protected _fileWatcherOnChange: vscode.FileSystemWatcher | undefined;

  constructor(
    protected _workspaceFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    this._workspaceFolder = _workspaceFolder;
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
        this.deleteCallback();
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

  public deleteCallback() {
    throw new Error('Not implemented error.');
  }

  public changeCallback() {
    throw new Error('Not implemented error.');
  }
}
