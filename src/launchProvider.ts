import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { SettingsProvider } from "./settingsProvider";
import {
  pathExists,
  Languages,
  getLanguageFromEditor,
  readJsonFile,
  Architectures,
  OperatingSystems,
  Debuggers,
} from "./utils";

interface JSONInterface {
  configurations: Array<any>;
}

export class LaunchProvider {
  public debugConfigs: any | undefined;
  public templatePath: string;
  public launchPath: string;
  public workspacePath: string;
  public fileWatcherOnDelete: vscode.FileSystemWatcher | undefined = undefined;

  constructor(
    public settingsProvider: SettingsProvider,
    workspacePath: string
  ) {
    this.workspacePath = workspacePath;
    const vscodeDirectory = path.join(this.workspacePath, ".vscode");
    this.launchPath = path.join(vscodeDirectory, "launch.json");

    const extDirectory = path.dirname(__dirname);
    const tasksDirectory = path.join(extDirectory, "src", "templates");
    this.templatePath = path.join(tasksDirectory, "launch_template.json");

    if (!pathExists(this.templatePath)) {
      return;
    }

    this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      this.launchPath,
      true,
      true,
      false
    );

    if (!pathExists(this.launchPath)) {
      this.createDebugConfig();
    }

    this.fileWatcherOnDelete.onDidDelete(() => {
      this.updateDebugConfig();
    });
  }

  public createDebugConfig() {
    if (!pathExists(this.launchPath)) {
      fs.mkdirSync(path.dirname(this.launchPath), { recursive: true });
    }
    this.getDebugConfig(this.templatePath, this.launchPath);
  }

  public updateDebugConfig() {
    this.getDebugConfig(this.launchPath, this.launchPath);
  }

  private getDebugConfig(inputFilePath: string, outFilePath: string) {
    let configJson: JSONInterface = readJsonFile(inputFilePath);

    if (undefined === configJson) {
      return;
    }

    configJson.configurations[0].name = `Launch: Debug Program`;
    if (undefined !== this.settingsProvider.debugger) {
      configJson.configurations[0].MIMode = this.settingsProvider.debugger;
      configJson.configurations[0].miDebuggerPath = this.settingsProvider.debuggerPath;

      if (OperatingSystems.windows === this.settingsProvider.operatingSystem) {
        configJson.configurations[0].externalConsole = true;
      }
    }

    const jsonString = JSON.stringify(configJson, null, 2);
    fs.writeFileSync(outFilePath, jsonString);
  }
}
