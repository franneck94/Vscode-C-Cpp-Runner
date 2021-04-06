"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchProvider = void 0;
const path = require("path");
const fileProvider_1 = require("./fileProvider");
const utils_1 = require("../utils");
const types_1 = require("../types");
class LaunchProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspaceFolder, activeFolder, templateFileName, outputFileName) {
        super(settings, workspaceFolder, templateFileName, outputFileName);
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.activeFolder = activeFolder;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
        }
    }
    writeFileData(inputFilePath, outFilePath) {
        const configJson = utils_1.readJsonFile(inputFilePath);
        if (!configJson) {
            return;
        }
        if (!this.activeFolder) {
            this.activeFolder = this.workspaceFolder;
        }
        configJson.configurations[0].name = `Launch: Debug Program`;
        if (this.settings.debugger) {
            configJson.configurations[0].MIMode = this.settings.debugger;
            configJson.configurations[0].miDebuggerPath = this.settings.debuggerPath;
            if (types_1.OperatingSystems.windows === this.settings.operatingSystem) {
                configJson.configurations[0].externalConsole = true;
            }
        }
        configJson.configurations[0].cwd = this.activeFolder;
        const debugPath = path.join(this.activeFolder, 'build/Debug/outDebug');
        configJson.configurations[0].program = debugPath;
        utils_1.writeJsonFile(outFilePath, configJson);
    }
}
exports.LaunchProvider = LaunchProvider;
//# sourceMappingURL=launchProvider.js.map