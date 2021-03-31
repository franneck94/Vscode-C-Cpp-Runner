"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class PropertiesProvider {
    constructor(settings, workspacePath) {
        this.settings = settings;
        this.fileWatcherOnDelete = undefined;
        this.workspacePath = workspacePath;
        const vscodeDirectory = path.join(this.workspacePath, ".vscode");
        this.propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "templates");
        this.templatePath = path.join(tasksDirectory, "properties_template.json");
        if (!utils_1.pathExists(this.templatePath)) {
            return;
        }
        this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(this.propertiesPath, true, true, false);
        if (!utils_1.pathExists(this.propertiesPath)) {
            this.createProperties();
        }
        this.fileWatcherOnDelete.onDidDelete(() => {
            this.createProperties();
        });
    }
    createProperties() {
        if (!utils_1.pathExists(this.propertiesPath)) {
            fs.mkdirSync(path.dirname(this.propertiesPath), { recursive: true });
        }
        this.getProperties(this.templatePath, this.propertiesPath);
    }
    updateProperties() {
        this.getProperties(this.propertiesPath, this.propertiesPath);
    }
    getProperties(inputFilePath, outFilePath) {
        let configJson = utils_1.readJsonFile(inputFilePath);
        if (undefined === configJson) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const language = utils_1.getLanguageFromEditor(editor, this.workspacePath);
        const triplet = `${this.settings.operatingSystem}-${this.settings.cCompiler}-${this.settings.architecure}`;
        configJson.configurations[0].compilerArgs = this.settings.warnings.split(" ");
        configJson.configurations[0].cppStandard = this.settings.standardCpp;
        configJson.configurations[0].cStandard =
            this.settings.standardC === "c90" ? "c89" : this.settings.standardC;
        if (utils_1.Languages.cpp === language) {
            configJson.configurations[0].compilerPath = this.settings.compilerPathCpp;
        }
        else {
            configJson.configurations[0].compilerPath = this.settings.compilerPathC;
        }
        configJson.configurations[0].name = triplet;
        configJson.configurations[0].intelliSenseMode = triplet;
        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(outFilePath, jsonString);
    }
}
exports.PropertiesProvider = PropertiesProvider;
//# sourceMappingURL=propertiesProvider.js.map