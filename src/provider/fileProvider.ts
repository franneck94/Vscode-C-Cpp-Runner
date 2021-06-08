import * as path from 'path';

import { extensionPath } from '../extension';
import { mkdirRecursive, pathExists, readJsonFile } from '../utils/fileUtils';
import { JsonConfiguration } from '../utils/types';
import { CallbackProvider } from './callbackProvider';
import { SettingsProvider } from './settingsProvider';

export abstract class FileProvider extends CallbackProvider {
  protected readonly templatePath: string;

  constructor(
    protected settings: SettingsProvider,
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

    let doUpdate = false;
    if (!pathExists(this._outputPath)) {
      doUpdate = true;
    } else {
      const configJson: JsonConfiguration = readJsonFile(this._outputPath);
      if (configJson) {
        const triplet: string = configJson.configurations[0].name;

        if (!triplet.includes(this.settings.operatingSystem)) {
          doUpdate = true;
        }
      }
    }

    if (doUpdate) {
      this.settings.getCommands();
      this.createFileData();
    }
  }

  public createFileData() {
    if (pathExists(this._outputPath)) return;

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    this.writeFileData();
  }

  public updateFileContent() {
    this.writeFileData();
  }

  public writeFileData() {
    throw new Error('Not implemented error.');
  }

  protected _updateFolderData(_workspaceFolder: string) {
    this._workspaceFolder = _workspaceFolder;
    this._vscodeDirectory = path.join(this._workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, this.outputFileName);
    this.createFileWatcher();
  }

  public deleteCallback() {
    this.createFileData();
  }

  public changeCallback() {}
}
