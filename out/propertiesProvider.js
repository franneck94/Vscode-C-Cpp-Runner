"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
const fileProvider_1 = require("./fileProvider");
class PropertiesProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspacePath, templateFileName, outputFileName) {
        super(settings, workspacePath, templateFileName, outputFileName);
        this.settings = settings;
        this.workspacePath = workspacePath;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
    }
    writeFileData(inputFilePath, outFilePath) {
        let configJson = utils_1.readJsonFile(inputFilePath);
        if (undefined === configJson) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const language = utils_1.getLanguageFromEditor(editor, this.workspacePath);
        const triplet = `${this.settings.operatingSystem}-${this.settings.cCompiler}-${this.settings.architecure}`;
        let config = configJson.configurations[0];
        config.compilerArgs = this.settings.warnings.split(" ");
        if (this.settings.compilerArgs) {
            config.compilerArgs = [
                ...config.compilerArgs,
                ...this.settings.compilerArgs.split(" "),
            ];
        }
        else {
            config.compilerArgs = [...this.settings.warnings.split(" ")];
        }
        if (this.settings.includePaths) {
            config.includePath = [
                ...config.includePath,
                ...this.settings.includePaths.split(" "),
            ];
        }
        else {
            config.includePath = [config.includePath[0]];
        }
        config.cppStandard = this.settings.standardCpp;
        config.cStandard =
            this.settings.standardC === "c90" ? "c89" : this.settings.standardC;
        if (utils_1.Languages.cpp === language) {
            config.compilerPath = this.settings.compilerPathCpp;
        }
        else {
            config.compilerPath = this.settings.compilerPathC;
        }
        config.name = triplet;
        config.intelliSenseMode = triplet;
        utils_1.writeJsonFile(outFilePath, configJson);
    }
}
exports.PropertiesProvider = PropertiesProvider;
//# sourceMappingURL=propertiesProvider.js.map