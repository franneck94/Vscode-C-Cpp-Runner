"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class PropertiesProvider {
    constructor(settings, workspacePath) {
        this.fileWatcherOnDelete = undefined;
        this.cCompiler = undefined;
        this.cppCompiler = undefined;
        this.plattformCategory = settings.plattformCategory;
        this.cCompiler = settings.cCompiler;
        this.cppCompiler = settings.cppCompiler;
        const vscodeDirectory = path.join(workspacePath, ".vscode");
        this.propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "tasks");
        this.templatePath = path.join(tasksDirectory, "properties_template.json");
        if (!utils_1.pathExists(this.templatePath)) {
            return;
        }
        this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(this.propertiesPath, true, true, false);
        if (!utils_1.pathExists(this.propertiesPath)) {
            this.createProperties(settings);
        }
        this.fileWatcherOnDelete.onDidDelete(() => {
            this.createProperties(settings);
        });
    }
    createProperties(settings) {
        let configJson;
        try {
            const fileContent = fs.readFileSync(this.templatePath, "utf-8");
            configJson = JSON.parse(fileContent);
        }
        catch (err) {
            return;
        }
        if (!configJson.configurations) {
            return;
        }
        let languageMode;
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            languageMode = utils_1.LanguageMode.c;
        }
        else {
            const fileDirName = path.dirname(editor.document.fileName);
            languageMode = utils_1.getLanguageMode(fileDirName);
        }
        configJson.configurations[0].compilerArgs = settings.warnings.split(" ");
        configJson.configurations[0].cppStandard = settings.standardCpp;
        configJson.configurations[0].cStandard = settings.standardC === 'c90' ? 'c89' : settings.standardC;
        if (languageMode === utils_1.LanguageMode.cpp) {
            configJson.configurations[0].compilerPath = settings.compilerPathCpp;
            if (this.cppCompiler !== undefined) {
                configJson.configurations[0].name = `${this.plattformCategory}-x64-${this.cppCompiler}`;
                const intelliSenseName = this.cppCompiler === 'g++' ? 'gcc' : 'clang';
                configJson.configurations[0].intelliSenseMode = `${this.plattformCategory}-${intelliSenseName}-x64`;
            }
            else {
                // TODO
            }
        }
        else {
            configJson.configurations[0].compilerPath = settings.compilerPathC;
            if (this.cCompiler !== undefined) {
                configJson.configurations[0].name = `${this.plattformCategory}-x64-${this.cCompiler}`;
                configJson.configurations[0].intelliSenseMode = `${this.plattformCategory}-${this.cCompiler}-x64`;
            }
            else {
                // TODO
            }
        }
        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(this.propertiesPath, jsonString);
    }
}
exports.PropertiesProvider = PropertiesProvider;
//# sourceMappingURL=propertiesProvider.js.map