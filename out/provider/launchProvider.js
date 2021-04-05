"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchProvider = void 0;
const path = require("path");
const fileProvider_1 = require("./fileProvider");
const utils_1 = require("../utils");
class LaunchProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspaceFolder, pickedFolder, templateFileName, outputFileName) {
        super(settings, workspaceFolder, templateFileName, outputFileName);
        this.settings = settings;
        this.workspaceFolder = workspaceFolder;
        this.pickedFolder = pickedFolder;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
        if (!this.pickedFolder) {
            this.pickedFolder = this.workspaceFolder;
        }
    }
    writeFileData(inputFilePath, outFilePath) {
        const configJson = utils_1.readJsonFile(inputFilePath);
        if (!configJson) {
            return;
        }
        if (!this.pickedFolder) {
            this.pickedFolder = this.workspaceFolder;
        }
        configJson.configurations[0].name = `Launch: Debug Program`;
        if (undefined !== this.settings.debugger) {
            configJson.configurations[0].MIMode = this.settings.debugger;
            configJson.configurations[0].miDebuggerPath = this.settings.debuggerPath;
            if (utils_1.OperatingSystems.windows === this.settings.operatingSystem) {
                // XXX: Either gdb or the C/C++ extension has issues on windows with the internal terminal
                configJson.configurations[0].externalConsole = true;
            }
        }
        configJson.configurations[0].cwd = this.pickedFolder;
        const debugPath = path.join(this.pickedFolder, "build/Debug/outDebug");
        configJson.configurations[0].program = debugPath;
        utils_1.writeJsonFile(outFilePath, configJson);
    }
}
exports.LaunchProvider = LaunchProvider;
//# sourceMappingURL=launchProvider.js.map