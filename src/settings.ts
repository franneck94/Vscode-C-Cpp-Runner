import * as vscode from "vscode";

import { getPlattformCategory } from './utils'

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    public config = vscode.workspace.getConfiguration(extensionName);
    public enableWarnings: boolean = true;
    public warnings: string = "";
    public warningsAsError: boolean = true;
    public compilerPathC: string = "";
    public compilerPathCpp: string = "";
    public makePath: string = "";
    public standardC: string = "";
    public standardCpp: string = "";
    public plattformCategory: string = "";

    constructor() {
        this.plattformCategory = getPlattformCategory();
        if (this.plattformCategory === 'macos') {
            this.config.update("compilerPathC", "clang", vscode.ConfigurationTarget.Global);
            this.config.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
        }
        this.getSettings();
    };

    public getSettings() {
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
