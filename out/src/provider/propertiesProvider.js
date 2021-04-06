"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesProvider = void 0;
const fileProvider_1 = require("./fileProvider");
const utils_1 = require("../utils");
class PropertiesProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspaceFolder, templateFileName, outputFileName) {
        super(settings, workspaceFolder, templateFileName, outputFileName);
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
    }
    writeFileData(inputFilePath, outFilePath) {
        const configJson = utils_1.readJsonFile(inputFilePath);
        if (!configJson) {
            return;
        }
        const language = utils_1.getLanguage(this.workspaceFolder);
        const triplet = `${this.settings.operatingSystem}-` +
            `${this.settings.cCompiler}-` +
            `${this.settings.architecure}`;
        const config = configJson.configurations[0];
        config.compilerArgs = this.settings.warnings.split(' ');
        if (this.settings.compilerArgs) {
            config.compilerArgs = [
                ...config.compilerArgs,
                ...this.settings.compilerArgs.split(' '),
            ];
        }
        else {
            config.compilerArgs = [...this.settings.warnings.split(' ')];
        }
        if (this.settings.includePaths) {
            config.includePath = [
                ...config.includePath,
                ...this.settings.includePaths.split(' '),
            ];
        }
        else {
            config.includePath = [config.includePath[0]];
        }
        config.cppStandard = this.settings.standardCpp;
        config.cStandard =
            this.settings.standardC === 'c90' ? 'c89' : this.settings.standardC;
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