"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchProvider = void 0;
const fileProvider_1 = require("./fileProvider");
const utils_1 = require("./utils");
class LaunchProvider extends fileProvider_1.FileProvider {
    constructor(settings, workspacePath, templateFileName, outputFileName) {
        super(settings, workspacePath, templateFileName, outputFileName);
        this.settings = settings;
        this.workspacePath = workspacePath;
        this.templateFileName = templateFileName;
        this.outputFileName = outputFileName;
    }
    writeFileData(inputFilePath, outFilePath) {
        const configJson = utils_1.readJsonFile(inputFilePath);
        if (!configJson) {
            return;
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
        utils_1.writeJsonFile(outFilePath, configJson);
    }
}
exports.LaunchProvider = LaunchProvider;
//# sourceMappingURL=launchProvider.js.map