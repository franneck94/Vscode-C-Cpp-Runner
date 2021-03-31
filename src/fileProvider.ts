import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { pathExists } from "./utils";
import { SettingsProvider } from "./settingsProvider";

export class FileProvider {
  public templatePath: string;
  public outputPath: string;
  public fileWatcherOnDelete: vscode.FileSystemWatcher | undefined = undefined;

  constructor(
    public settings: SettingsProvider,
    public workspacePath: string,
    public templateFileName: string,
    public outputFileName: string
  ) {
    this.settings = settings;
    this.workspacePath = workspacePath;
    const vscodeDirectory = path.join(this.workspacePath, ".vscode");
    this.outputPath = path.join(vscodeDirectory, outputFileName);

    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, "src", "templates");
    this.templatePath = path.join(templateDirectory, templateFileName);

    if (!pathExists(this.templatePath)) {
      return;
    }

    this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      this.outputPath,
      true,
      true,
      false
    );

    if (!pathExists(this.outputPath)) {
      this.createFileData();
    }

    this.fileWatcherOnDelete.onDidDelete(() => {
      this.createFileData();
    });
  }

  public createFileData() {
    if (!pathExists(this.outputPath)) {
      fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
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
