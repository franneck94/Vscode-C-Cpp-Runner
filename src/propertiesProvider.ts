import * as vscode from "vscode";

import { FileProvider } from "./fileProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  getLanguage,
  JsonInterface,
  Languages,
  readJsonFile,
  writeJsonFile,
} from "./utils";

export class PropertiesProvider extends FileProvider {
  constructor(
    public settings: SettingsProvider,
    public workspaceFolder: string,
    public pickedFolder: string,
    public templateFileName: string,
    public outputFileName: string
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    const configJson: JsonInterface = readJsonFile(inputFilePath);
    if (!configJson) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = getLanguage(this.workspaceFolder);
    const triplet =
      `${this.settings.operatingSystem}-` +
      `${this.settings.cCompiler}-` +
      `${this.settings.architecure}`;
    const config = configJson.configurations[0];

    config.compilerArgs = this.settings.warnings.split(" ");
    if (this.settings.compilerArgs) {
      config.compilerArgs = [
        ...config.compilerArgs,
        ...this.settings.compilerArgs.split(" "),
      ];
    } else {
      config.compilerArgs = [...this.settings.warnings.split(" ")];
    }

    if (this.settings.includePaths) {
      config.includePath = [
        ...config.includePath,
        ...this.settings.includePaths.split(" "),
      ];
    } else {
      config.includePath = [config.includePath[0]];
    }

    config.cppStandard = this.settings.standardCpp;
    config.cStandard =
      this.settings.standardC === "c90" ? "c89" : this.settings.standardC;

    if (Languages.cpp === language) {
      config.compilerPath = this.settings.compilerPathCpp;
    } else {
      config.compilerPath = this.settings.compilerPathC;
    }
    config.name = triplet;
    config.intelliSenseMode = triplet;

    writeJsonFile(outFilePath, configJson);
  }
}
