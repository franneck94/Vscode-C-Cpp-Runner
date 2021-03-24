"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
const extensionName = 'C_Cpp_Runner';
class SettingsProvider {
    constructor() {
        this.config = vscode.workspace.getConfiguration(extensionName);
        this.enableWarnings = true;
        this.warnings = "";
        this.warningsAsError = true;
        this.compilerPathC = "";
        this.compilerPathCpp = "";
        this.makePath = "";
        this.standardC = "";
        this.standardCpp = "";
        this.plattformCategory = "";
        this.plattformCategory = utils_1.getPlattformCategory();
        if (this.plattformCategory === 'macos') {
            this.config.update("compilerPathC", "clang", vscode.ConfigurationTarget.Global);
            this.config.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
        }
        this.getSettings();
    }
    ;
    getSettings() {
        this.config = vscode.workspace.getConfiguration(extensionName);
        this.enableWarnings = this.config.get("enableWarnings", true);
        this.warnings = this.config.get("warnings", "-Wall -Wextra -Wpedantic");
        this.warningsAsError = this.config.get("warningsAsError", false);
        this.compilerPathC = this.config.get("compilerPathC", "gcc");
        this.compilerPathCpp = this.config.get("compilerPathCpp", "g++");
        this.makePath = this.config.get("makePath", "make");
        this.standardC = this.config.get("standardC", "c90");
        this.standardCpp = this.config.get("standardCpp", "c++11");
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settings.js.map