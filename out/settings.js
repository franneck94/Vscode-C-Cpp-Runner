"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
const extensionName = 'C_Cpp_Runner';
class SettingsProvider {
    constructor() {
        // Global settings
        this.config = vscode.workspace.getConfiguration(extensionName);
        this.plattformCategory = utils_1.getPlattformCategory();
        // Settings
        this.enableWarnings = true;
        this.warnings = "";
        this.warningsAsError = true;
        this.compilerPathC = "";
        this.compilerPathCpp = "";
        this.makePath = "";
        this.standardC = "";
        this.standardCpp = "";
        this.checkCompilers();
        this.getSettings();
    }
    ;
    /**
     * Check if gcc/g++ or clang/clang++ can be found in PATH.
     */
    checkCompilers() {
        if (this.plattformCategory === 'macos') {
            if (utils_1.commandExists('clang')) {
                this.config.update("compilerPathCpp", "clang", vscode.ConfigurationTarget.Global);
            }
            if (utils_1.commandExists('clang++')) {
                this.config.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
            }
        }
        if (this.plattformCategory === 'linux') {
            if (!utils_1.commandExists('gcc') && utils_1.commandExists('clang')) {
                this.config.update("compilerPathCpp", "clang", vscode.ConfigurationTarget.Global);
            }
            if (!utils_1.commandExists('g++') && utils_1.commandExists('clang++')) {
                this.config.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
            }
        }
        if (this.plattformCategory === 'win32') {
            if (!utils_1.commandExists('gcc') && utils_1.commandExists('clang')) {
                this.config.update("compilerPathCpp", "clang", vscode.ConfigurationTarget.Global);
            }
            if (!utils_1.commandExists('g++') && utils_1.commandExists('clang++')) {
                this.config.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
            }
        }
    }
    /**
     * Read in the current settings.
     */
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