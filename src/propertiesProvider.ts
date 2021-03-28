import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getLanguageMode, LanguageMode, pathExists } from "./utils";
import { SettingsProvider } from "./settingsProvider";

export class PropertiesProvider {
    public templatePath: string;
    public propertiesPath: string;
    public configurationName: string | undefined;
    public compilerPath: string | undefined;
    public cStandard: string | undefined;
    public cppStandard: string | undefined; 
    public intelliSenseMode: string | undefined;
    public compilerArgs: Array<string> | undefined;
    public fileWatcherOnDelete: vscode.FileSystemWatcher | undefined = undefined;
    public plattformCategory: string;
    public cCompiler: string | undefined = undefined;
    public cppCompiler: string | undefined = undefined;

    constructor(
        settings: SettingsProvider,
        workspacePath: string
    ) {
        this.plattformCategory = settings.plattformCategory;
        this.cCompiler = settings.cCompiler;
        this.cppCompiler  =settings.cppCompiler;

        const vscodeDirectory = path.join(workspacePath, ".vscode");
        this.propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");

        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "tasks");
        this.templatePath = path.join(tasksDirectory, "properties_template.json");

        if (!pathExists(this.templatePath)) {
            return;
        }

        this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
            this.propertiesPath, true, true, false
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

        let languageMode: LanguageMode;
        const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

        if (!editor) {
            languageMode = LanguageMode.c;
        } else {
            const fileDirName = path.dirname(editor.document.fileName);
            languageMode = getLanguageMode(fileDirName);
        }

        configJson.configurations[0].compilerArgs = settings.warnings.split(" ");
        configJson.configurations[0].cppStandard = settings.standardCpp;
        configJson.configurations[0].cStandard = settings.standardC === 'c90' ? 'c89' : settings.standardC;

        if (languageMode === LanguageMode.cpp) {
            configJson.configurations[0].compilerPath = settings.compilerPathCpp;
            if (this.cppCompiler !== undefined) {
                configJson.configurations[0].name = `${this.plattformCategory}-x64-${this.cppCompiler}`;
                const intelliSenseName = this.cppCompiler === 'g++' ? 'gcc' : 'clang';
                configJson.configurations[0].intelliSenseMode = `${this.plattformCategory}-${intelliSenseName}-x64`;
            } else {
                // TODO
            }
        } else {
            configJson.configurations[0].compilerPath = settings.compilerPathC;
            if (this.cCompiler !== undefined) {
                configJson.configurations[0].name = `${this.plattformCategory}-x64-${this.cCompiler}`;
                configJson.configurations[0].intelliSenseMode = `${this.plattformCategory}-${this.cCompiler}-x64`;
            } else {
                // TODO
            }
        }

        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(this.propertiesPath, jsonString);
    }
}