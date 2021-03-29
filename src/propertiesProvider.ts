import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getLanguage, Languages, pathExists } from "./utils";
import { SettingsProvider } from "./settingsProvider";

export class PropertiesProvider {
  public templatePath: string;
  public propertiesPath: string;
  public fileWatcherOnDelete: vscode.FileSystemWatcher | undefined = undefined;

  constructor(settings: SettingsProvider, workspacePath: string) {
    const vscodeDirectory = path.join(workspacePath, ".vscode");
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
    let configJson;
    try {
      const fileContent = fs.readFileSync(this.templatePath, "utf-8");
      configJson = JSON.parse(fileContent);
    } catch (err) {
      return;
    }

    if (!configJson.configurations) {
      return;
    }

    let language: Languages;
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      language = Languages.c;
    } else {
      const fileDirName = path.dirname(editor.document.fileName);
      language = getLanguage(fileDirName);
    }

    configJson.configurations[0].compilerArgs = settings.warnings.split(" ");
    configJson.configurations[0].cppStandard = settings.standardCpp;
    configJson.configurations[0].cStandard =
      settings.standardC === "c90" ? "c89" : settings.standardC;

    if (Languages.cpp === language) {
      configJson.configurations[0].compilerPath = settings.compilerPathCpp;
      if (undefined !== settings.cppCompiler) {
        configJson.configurations[0].name = `${settings.plattformCategory}-${settings.architecure}-${settings.cppCompiler}`;
        const intelliSenseName = settings.cppCompiler === "g++" ? "gcc" : "clang";
        configJson.configurations[0].intelliSenseMode = `${settings.plattformCategory}-${intelliSenseName}-${settings.architecure}`;
      } else {
        // TODO
      }
    } else {
      configJson.configurations[0].compilerPath = settings.compilerPathC;
      if (undefined !== settings.cCompiler) {
        configJson.configurations[0].name = `${settings.plattformCategory}-${settings.architecure}-${settings.cCompiler}`;
        configJson.configurations[0].intelliSenseMode = `${settings.plattformCategory}-${settings.cCompiler}-${settings.architecure}`;
      } else {
        // TODO
      }
    }

    const jsonString = JSON.stringify(configJson, null, 2);
    fs.writeFileSync(this.propertiesPath, jsonString);
  }
}
