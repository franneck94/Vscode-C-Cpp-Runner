import * as vscode from "vscode";

import { getPlattformCategory, commandExists } from './utils';

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    // Global settings
    public config = vscode.workspace.getConfiguration(extensionName);
    public plattformCategory = getPlattformCategory();
    public cCompiler: string | undefined = undefined;
    public cppCompiler: string | undefined = undefined;
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
    public async checkCompilers() {
        if (this.plattformCategory === 'macos') {
            let { found: foundGcc, path: pathGcc } = await commandExists('gcc');
            let { found: foundGpp, path: pathGpp } = await commandExists('g++');
            let { found: foundClang, path: pathClang } = await commandExists('clang');
            let { found: foundClangpp, path: pathClangpp } = await commandExists('clang++');

            if (foundClang) {
                this.config.update(
                    "compilerPathC",
                    pathClang,
                    vscode.ConfigurationTarget.Global
                );
                this.cCompiler = "clang";
            } else if (foundGcc) {
                this.config.update(
                    "compilerPathC",
                    pathGcc,
                    vscode.ConfigurationTarget.Global
                );
                this.cCompiler = "gcc";
            } else {
                // TODO
                this.cCompiler = undefined;
            }

            if (foundClangpp) {
                this.config.update(
                    "compilerPathCpp",
                    pathClangpp,
                    vscode.ConfigurationTarget.Global
                );
                this.cppCompiler = "clang++";
            } else if (foundGpp) {
                this.config.update(
                    "compilerPathCpp",
                    pathGpp,
                    vscode.ConfigurationTarget.Global
                );
                this.cppCompiler = "g++";
            } else {
                // TODO
                this.cppCompiler = undefined;
            }
        } else if (this.plattformCategory === 'linux' ||
                    this.plattformCategory === 'windows') {
            let { found: foundGcc, path: pathGcc } = await commandExists('gcc');
            let { found: foundGpp, path: pathGpp } = await commandExists('g++');
            let { found: foundClang, path: pathClang } = await commandExists('clang');
            let { found: foundClangpp, path: pathClangpp } = await commandExists('clang++');

            if (foundGcc) {
                this.config.update(
                    "compilerPathC",
                    pathGcc,
                    vscode.ConfigurationTarget.Global
                );
                this.cCompiler = "gcc";
            } else if (foundClang) {
                this.config.update(
                    "compilerPathC",
                    pathClang,
                    vscode.ConfigurationTarget.Global
                );
                this.cCompiler = "clang";
            } else {
                // TODO
                this.cCompiler = undefined;
            }

            if (foundGpp) {
                this.config.update(
                    "compilerPathCpp",
                    pathGpp,
                    vscode.ConfigurationTarget.Global
                );
                this.cppCompiler = "g++";
            } else if (foundClangpp) {
                this.config.update(
                    "compilerPathCpp",
                    pathClangpp,
                    vscode.ConfigurationTarget.Global
                );
                this.cppCompiler = "clang++";
            } else {
                // TODO
                this.cppCompiler = undefined;
            }
        }  else {
            // TODO
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
