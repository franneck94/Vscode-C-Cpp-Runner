import * as vscode from "vscode";

import { getPlattformCategory, commandExists } from './utils';

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    // Global settings
    public config = vscode.workspace.getConfiguration(extensionName);
    public plattformCategory = getPlattformCategory();
    // Settings
    public enableWarnings: boolean = true;
    public warnings: string = "";
    public warningsAsError: boolean = true;
    public compilerPathC: string = "";
    public compilerPathCpp: string = "";
    public makePath: string = "";
    public standardC: string = "";
    public standardCpp: string = "";

    constructor() {
        this.checkCompilers();
        this.getSettings();
    };

    /**
     * Check if gcc/g++ or clang/clang++ can be found in PATH.
     */
    public checkCompilers() {
        if (this.plattformCategory === 'macos') {
            if (commandExists('clang')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang",
                    vscode.ConfigurationTarget.Global
                );
            }
            if (commandExists('clang++')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang++",
                    vscode.ConfigurationTarget.Global
                );
            }
        }

        if (this.plattformCategory === 'linux') {
            if (!commandExists('gcc') && commandExists('clang')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang",
                    vscode.ConfigurationTarget.Global
                );
            }
            if (!commandExists('g++') && commandExists('clang++')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang++",
                    vscode.ConfigurationTarget.Global
                );
            }
        }

        if (this.plattformCategory === 'win32') {
            if (!commandExists('gcc') && commandExists('clang')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang",
                    vscode.ConfigurationTarget.Global
                );
            }
            if (!commandExists('g++') && commandExists('clang++')) {
                this.config.update(
                    "compilerPathCpp",
                    "clang++",
                    vscode.ConfigurationTarget.Global
                );
            }
        }
    }

    /**
     * Read in the current settings.
     */
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
