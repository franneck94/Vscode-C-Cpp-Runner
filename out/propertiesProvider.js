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
        const vscodeDirectory = path.join(workspacePath, ".vscode");
        this.propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "templates");
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
        let configJson = utils_1.readJsonFile(this.templatePath);
        let language;
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            language = utils_1.Languages.c;
        }
        else {
            const fileDirName = path.dirname(editor.document.fileName);
            language = utils_1.getLanguage(fileDirName);
        }
        const triplet = `${settings.plattformCategory}-${settings.cCompiler}-${settings.architecure}`;
        configJson.configurations[0].compilerArgs = settings.warnings.split(" ");
        configJson.configurations[0].cppStandard = settings.standardCpp;
        configJson.configurations[0].cStandard =
            settings.standardC === "c90" ? "c89" : settings.standardC;
        if (utils_1.Languages.cpp === language) {
            configJson.configurations[0].compilerPath = settings.compilerPathCpp;
            if (undefined !== settings.cppCompiler) {
                configJson.configurations[0].name = triplet;
                configJson.configurations[0].intelliSenseMode = triplet;
            }
        }
        else {
            configJson.configurations[0].compilerPath = settings.compilerPathC;
            if (undefined !== settings.cCompiler) {
                configJson.configurations[0].name = triplet;
                configJson.configurations[0].intelliSenseMode = triplet;
            }
        }
        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(this.propertiesPath, jsonString);
    }
    updateProperties(settings) {
        let configJson = utils_1.readJsonFile(this.propertiesPath);
        const triplet = `${settings.plattformCategory}-${settings.cCompiler}-${settings.architecure}`;
        configJson.configurations[0].compilerPath = settings.cCompiler;
        configJson.configurations[0].name = triplet;
        configJson.configurations[0].intelliSenseMode = triplet;
        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(this.propertiesPath, jsonString);
    }
}
exports.PropertiesProvider = PropertiesProvider;
//# sourceMappingURL=propertiesProvider.js.map