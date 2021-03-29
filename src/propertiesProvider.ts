import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getLanguageFromEditor, Languages, pathExists, readJsonFile } from "./utils";
import { SettingsProvider } from "./settingsProvider";

export class PropertiesProvider {
  public templatePath: string;
  public propertiesPath: string;
  public workspacePath: string;
  public fileWatcherOnDelete: vscode.FileSystemWatcher | undefined = undefined;

  constructor(settings: SettingsProvider, workspacePath: string) {
    this.workspacePath = workspacePath;
    const vscodeDirectory = path.join(this.workspacePath, ".vscode");
    this.propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");

    const extDirectory = path.dirname(__dirname);
    const tasksDirectory = path.join(extDirectory, "src", "templates");
    this.templatePath = path.join(tasksDirectory, "properties_template.json");

    if (!pathExists(this.templatePath)) {
      return;
    }

    this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      this.propertiesPath,
      true,
      true,
      false
    );

    if (!pathExists(this.propertiesPath)) {
      this.createProperties(settings);
    }

    this.fileWatcherOnDelete.onDidDelete(() => {
      this.createProperties(settings);
    });
  }

  public createProperties(settings: SettingsProvider) {
    let configJson = readJsonFile(this.templatePath);
    const editor = vscode.window.activeTextEditor;
    const language = getLanguageFromEditor(editor, this.workspacePath);
    const triplet = `${settings.plattformCategory}-${settings.cCompiler}-${settings.architecure}`;

    configJson.configurations[0].compilerArgs = settings.warnings.split(" ");
    configJson.configurations[0].cppStandard = settings.standardCpp;
    configJson.configurations[0].cStandard =
      settings.standardC === "c90" ? "c89" : settings.standardC;

    if (Languages.cpp === language) {
      configJson.configurations[0].compilerPath = settings.compilerPathCpp;
    } else {
      configJson.configurations[0].compilerPath = settings.compilerPathC;
    }
    configJson.configurations[0].name = triplet;
    configJson.configurations[0].intelliSenseMode = triplet;

    const jsonString = JSON.stringify(configJson, null, 2);
    if (!pathExists(this.propertiesPath)) {
      fs.mkdirSync(path.dirname(this.propertiesPath), { recursive: true });
    }
    fs.writeFileSync(this.propertiesPath, jsonString);
  }

  public updateProperties(settings: SettingsProvider) {
    let configJson = readJsonFile(this.propertiesPath);

    const editor = vscode.window.activeTextEditor;
    const language = getLanguageFromEditor(editor, this.workspacePath);
    const triplet = `${settings.plattformCategory}-${settings.cCompiler}-${settings.architecure}`;

    if (Languages.cpp === language) {
      configJson.configurations[0].compilerPath = settings.compilerPathCpp;
    } else {
      configJson.configurations[0].compilerPath = settings.compilerPathC;
    }
    configJson.configurations[0].name = triplet;
    configJson.configurations[0].intelliSenseMode = triplet;

    const jsonString = JSON.stringify(configJson, null, 2);
    fs.writeFileSync(this.propertiesPath, jsonString);
  }
}
