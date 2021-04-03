import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { SettingsProvider } from "./settingsProvider";
import { JsonInterface, pathExists, readJsonFile } from "./utils";

export class FileProvider {
  public templatePath: string;
  public outputPath: string;
  public vscodeDirectory: string;
  public fileWatcherOnDelete: vscode.FileSystemWatcher;

  constructor(
    public settings: SettingsProvider,
    public workspaceFolder: string,
    public templateFileName: string,
    public outputFileName: string
  ) {
    this.settings = settings;
    this.workspaceFolder = workspaceFolder;
    this.vscodeDirectory = path.join(this.workspaceFolder, ".vscode");
    this.outputPath = path.join(this.vscodeDirectory, outputFileName);
    const deletePattern = `${this.vscodeDirectory}/**`;

    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, "src", "templates");
    this.templatePath = path.join(templateDirectory, templateFileName);

    this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false
    );

    let doUpdate = false;
    if (!pathExists(this.outputPath)) {
      doUpdate = true;
    } else {
      const configJson: JsonInterface = readJsonFile(this.outputPath);
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

    this.fileWatcherOnDelete.onDidDelete(() => {
      this.createFileData();
    });
  }

  public createFileData() {
    if (pathExists(this.outputPath)) {
      return;
    }

    if (!pathExists(this.vscodeDirectory)) {
      fs.mkdirSync(this.vscodeDirectory, { recursive: true });
    }

    this.writeFileData(this.templatePath, this.outputPath);
  }

  public updateFileData() {
    this.writeFileData(this.outputPath, this.outputPath);
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    throw new Error("You have to implement the method doSomething!");
  }
}
