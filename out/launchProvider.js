"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchProvider = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
class LaunchProvider {
    constructor(settingsProvider, workspacePath) {
        this.settingsProvider = settingsProvider;
        this.fileWatcherOnDelete = undefined;
        this.workspacePath = workspacePath;
        const vscodeDirectory = path.join(this.workspacePath, ".vscode");
        this.launchPath = path.join(vscodeDirectory, "launch.json");
        const extDirectory = path.dirname(__dirname);
        const tasksDirectory = path.join(extDirectory, "src", "templates");
        this.templatePath = path.join(tasksDirectory, "launch_template.json");
        if (!utils_1.pathExists(this.templatePath)) {
            return;
        }
        this.fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(this.launchPath, true, true, false);
        if (!utils_1.pathExists(this.launchPath)) {
            this.createDebugConfig();
        }
        this.fileWatcherOnDelete.onDidDelete(() => {
            this.updateDebugConfig();
        });
    }
    createDebugConfig() {
        if (!utils_1.pathExists(this.launchPath)) {
            fs.mkdirSync(path.dirname(this.launchPath), { recursive: true });
        }
        this.getDebugConfig(this.templatePath, this.launchPath);
    }
    updateDebugConfig() {
        this.getDebugConfig(this.launchPath, this.launchPath);
    }
    getDebugConfig(inputFilePath, outFilePath) {
        let configJson = utils_1.readJsonFile(inputFilePath);
        if (undefined === configJson) {
            return;
        }
        configJson.configurations[0].name = `Launch: Debug Program`;
        if (undefined !== this.settingsProvider.debugger) {
            configJson.configurations[0].MIMode = this.settingsProvider.debugger;
            configJson.configurations[0].miDebuggerPath = this.settingsProvider.debuggerPath;
            if (utils_1.OperatingSystems.windows === this.settingsProvider.operatingSystem) {
                configJson.configurations[0].externalConsole = true;
            }
        }
        const jsonString = JSON.stringify(configJson, null, 2);
        fs.writeFileSync(outFilePath, jsonString);
    }
}
exports.LaunchProvider = LaunchProvider;
//# sourceMappingURL=launchProvider.js.map