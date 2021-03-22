import * as vscode from "vscode";

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    public config = vscode.workspace.getConfiguration(extensionName);
    public enableWarnings = this.config.get("enableWarnings", true);
    public warningsAsError = this.config.get("warningsAsError", false);
    public compilerPathC = this.config.get("compilerPathC", "gcc");
    public compilerPathCpp = this.config.get("compilerPathCpp", "g++");
    public makePath = this.config.get("makePath", "make");

    constructor() {};
}
