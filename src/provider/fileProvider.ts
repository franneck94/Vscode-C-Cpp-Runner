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
  protected readonly templatePath: string;
  protected readonly outputPath: string;
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
    this.outputPath = path.join(this._vscodeDirectory, outputFileName);
    const deletePattern = `${replaceBackslashes(this._vscodeDirectory)}/**`;

    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, 'src', '_templates');
    this.templatePath = path.join(templateDirectory, templateFileName);

    this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false,
    );

    let doUpdate = false;
    if (!pathExists(this.outputPath)) {
      doUpdate = true;
    } else {
      const configJson: JsonConfiguration = readJsonFile(this.outputPath);
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

    this._fileWatcherOnDelete.onDidDelete((e: vscode.Uri) => {
      const pathName = e.fsPath;
      if (
        pathName === this._vscodeDirectory ||
        path.basename(pathName) === this.outputFileName
      ) {
        this.createFileData();
      }
    });
  }

  public createFileData() {
    if (pathExists(this.outputPath)) {
      return;
    }

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    this.writeFileData();
  }

  public updateFileContent() {
    this.writeFileData();
  }

  public writeFileData() {
    throw new Error('You have to implement the method doSomething!');
  }
}
