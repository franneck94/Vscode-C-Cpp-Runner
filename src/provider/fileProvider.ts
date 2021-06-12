import * as path from 'path';

import { extensionPath } from '../extension';
import { mkdirRecursive, pathExists } from '../utils/fileUtils';
import { CallbackProvider } from './callbackProvider';

export abstract class FileProvider extends CallbackProvider {
  protected readonly templatePath: string;

  constructor(
    protected _workspaceFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    super(_workspaceFolder, templateFileName, outputFileName);

    const templateDirectory = path.join(
      extensionPath ? extensionPath : '',
      'templates',
    );
    this.templatePath = path.join(templateDirectory, templateFileName);

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }
  }

  protected updateCheck() {
    return false;
  }

  public writeFileData() {
    throw new Error('Not implemented error.');
  }

  public createFileData() {
    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    this.writeFileData();
  }

  public updateFileContent() {
    this.writeFileData();
  }

  public deleteCallback() {
    this.createFileData();
  }

  protected _updateFolderData(_workspaceFolder: string) {
    this._workspaceFolder = _workspaceFolder;
    this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, this.outputFileName);
    this.createFileWatcher();
  }
}
