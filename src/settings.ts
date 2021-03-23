import * as vscode from "vscode";

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    public config = vscode.workspace.getConfiguration(extensionName);
    public enableWarnings = this.config.get("enableWarnings", true);
    public warnings = this.config.get("warnings", "-Wall -Wextra -Wpedantic");
    public warningsAsError = this.config.get("warningsAsError", false);
    public compilerPathC = this.config.get("compilerPathC", "gcc");
    public compilerPathCpp = this.config.get("compilerPathCpp", "g++");
    public makePath = this.config.get("makePath", "make");
    public standardC = this.config.get("standardC", "c90");
    public standardCpp = this.config.get("standardCpp", "c++11");

    constructor() {};

    public getSettings() {
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
