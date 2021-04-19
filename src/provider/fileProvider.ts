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
  protected outputPath: string;
  protected vscodeDirectory: string;
  protected fileWatcherOnDelete: vscode.FileSystemWatcher;

  constructor(
    protected settings: SettingsProvider,
    protected workspaceFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    this.settings = settings;
    this.workspaceFolder = workspaceFolder;
    this.vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
    this.outputPath = path.join(this.vscodeDirectory, outputFileName);
    this.fileWatcherOnDelete = this.createFileWatcher();

    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, 'src', '_templates');
    this.templatePath = path.join(templateDirectory, templateFileName);

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

    this.fileWatcherOnDelete.onDidDelete((e: vscode.Uri) => {
      const pathName = e.fsPath;
      if (
        pathName === this.vscodeDirectory ||
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

    if (!pathExists(this.vscodeDirectory)) {
      mkdirRecursive(this.vscodeDirectory);
    }

    this.writeFileData();
  }

  public updateFileContent() {
    this.writeFileData();
  }

  public writeFileData() {
    throw new Error('You have to implement the method doSomething!');
  }

  protected createFileWatcher() {
    const deletePattern = `${replaceBackslashes(this.vscodeDirectory)}/**`;
    return vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false,
    );
  }

  protected _updatFolderData(workspaceFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this.vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
    this.outputPath = path.join(this.vscodeDirectory, this.outputFileName);
    this.fileWatcherOnDelete = this.createFileWatcher();
  }
}
