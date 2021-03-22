"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const vscode = require("vscode");
const extensionName = 'C_Cpp_Runner';
class SettingsProvider {
    constructor() {
        this.config = vscode.workspace.getConfiguration(extensionName);
        this.enableWarnings = this.config.get("enableWarnings", true);
        this.warningsAsError = this.config.get("warningsAsError", false);
        this.compilerPathC = this.config.get("compilerPathC", "gcc");
        this.compilerPathCpp = this.config.get("compilerPathCpp", "g++");
        this.makePath = this.config.get("makePath", "make");
    }
    ;
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settings.js.map