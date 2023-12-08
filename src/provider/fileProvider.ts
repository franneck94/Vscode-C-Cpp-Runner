import * as path from 'path';

import { extensionPath } from '../extension';
import { mkdirRecursive, pathExists } from '../utils/fileUtils';
import { getActivationState } from '../utils/vscodeUtils';
import { CallbackProvider } from './callbackProvider';

export abstract class FileProvider extends CallbackProvider {
  protected readonly templatePath: string | undefined;

  constructor(
    workspaceFolder: string,
    templateFileName: string | undefined,
    outputFileName: string,
  ) {
    super(workspaceFolder, templateFileName, outputFileName);

    const templateDirectory = path.join(
      extensionPath ? extensionPath : '',
      'templates',
    );

    if (templateFileName) {
      this.templatePath = path.join(templateDirectory, templateFileName);
    }

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }
  }

  protected abstract updateCheck(): boolean;

  public abstract writeFileData(): void;

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
    const extensionIsActive = getActivationState();
    if (extensionIsActive) this.createFileData();
  }

  protected _updateFolderData(_workspaceFolder: string) {
    this._workspaceFolder = _workspaceFolder;
    this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, this.outputFileName);
    this.createFileWatcher();
  }
}
