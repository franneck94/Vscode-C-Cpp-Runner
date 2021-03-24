"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
const extensionName = 'C_Cpp_Runner';
class SettingsProvider {
    constructor() {
        // Settings
        this.enableWarnings = true;
        this.warnings = "";
        this.warningsAsError = true;
        this.compilerPathC = "";
        this.compilerPathCpp = "";
        this.makePath = "";
        this.standardC = "";
        this.standardCpp = "";
        this.plattformCategory = "";
        this.globalConfig = vscode.workspace.getConfiguration(extensionName);
        this.editor = vscode.window.activeTextEditor;
        if (this.editor !== undefined) {
            this.uri = this.editor.document.uri;
            this.workspaceFolder = vscode.workspace.getWorkspaceFolder(this.uri);
            this.workspaceConfig = vscode.workspace.getConfiguration('extension', this.workspaceFolder);
        }
        this.plattformCategory = utils_1.getPlattformCategory();
        if (this.plattformCategory === 'macos') {
            this.globalConfig.update("compilerPathC", "clang", vscode.ConfigurationTarget.Global);
            this.globalConfig.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
        }
        this.getSettings();
    }
    ;
    getSettings() {
        this.globalConfig = vscode.workspace.getConfiguration(extensionName);
        this.enableWarnings = this.globalConfig.get("enableWarnings", true);
        this.warnings = this.globalConfig.get("warnings", "-Wall -Wextra -Wpedantic");
        this.warningsAsError = this.globalConfig.get("warningsAsError", false);
        this.compilerPathC = this.globalConfig.get("compilerPathC", "gcc");
        this.compilerPathCpp = this.globalConfig.get("compilerPathCpp", "g++");
        this.makePath = this.globalConfig.get("makePath", "make");
        this.standardC = this.globalConfig.get("standardC", "c90");
        this.standardCpp = this.globalConfig.get("standardCpp", "c++11");
        if (this.workspaceConfig !== undefined) {
            this.workspaceConfig = vscode.workspace.getConfiguration(extensionName, this.workspaceFolder);
            if (this.workspaceConfig.has("compilerPathC")) {
                this.compilerPathC = this.globalConfig.get("compilerPathC", "gcc");
            }
            if (this.workspaceConfig.has("compilerPathCpp")) {
                this.compilerPathC = this.globalConfig.get("compilerPathCpp", "gcc");
            }
        }
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settings.js.map