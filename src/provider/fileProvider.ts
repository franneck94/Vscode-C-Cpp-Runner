import * as path from 'path';
import * as vscode from 'vscode';

import { JsonConfiguration } from '../utils/types';
import {
  mkdirRecursive,
  pathExists,
  readJsonFile,
  replaceBackslashes,
} from '../utils/fileUtils';
import { SettingsProvider } from './settingsProvider';

export abstract class FileProvider {
  private readonly _templatePath: string;
  private readonly _outputPath: string;
  private readonly _vscodeDirectory: string;
  private readonly _fileWatcherOnDelete: vscode.FileSystemWatcher;

  constructor(
    protected settings: SettingsProvider,
    protected workspaceFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    this.settings = settings;
    this.workspaceFolder = workspaceFolder;
    this._vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, outputFileName);
    const deletePattern = `${replaceBackslashes(this._vscodeDirectory)}/**`;

    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, 'src', '_templates');
    this._templatePath = path.join(templateDirectory, templateFileName);

    this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false,
    );

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
      this.settings.checkCompilers();
      this.createFileData();
    }

    this._fileWatcherOnDelete.onDidDelete(() => {
      this.createFileData();
    });
  }

  public createFileData() {
    if (pathExists(this._outputPath)) {
      return;
    }

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    this.writeFileData(this._templatePath, this._outputPath);
  }

  public updateFileContent() {
    this.writeFileData(this._outputPath, this._outputPath);
  }

  // @ts-ignore
  public writeFileData(inputFilePath: string, outFilePath: string) {
    throw new Error('You have to implement the method doSomething!');
  }
}
