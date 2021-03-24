import * as vscode from "vscode";

import { getPlattformCategory } from './utils'

const extensionName: string = 'C_Cpp_Runner';

export class SettingsProvider {
    // Global settings
    public globalConfig : vscode.WorkspaceConfiguration | undefined;
    // Workspace settings
    public editor: vscode.TextEditor | undefined;
    public uri: vscode.Uri  | undefined;
    public workspaceFolder: vscode.WorkspaceFolder | undefined;
    public workspaceConfig: vscode.WorkspaceConfiguration | undefined;
    // Settings
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
        this.globalConfig = vscode.workspace.getConfiguration(extensionName);

        this.editor = vscode.window.activeTextEditor;
        if (this.editor !== undefined) {
            this.uri = this.editor.document.uri;
            this.workspaceFolder = vscode.workspace.getWorkspaceFolder(this.uri);
            this.workspaceConfig = vscode.workspace.getConfiguration('extension', this.workspaceFolder);
        }

        this.plattformCategory = getPlattformCategory();
        if (this.plattformCategory === 'macos') {
            this.globalConfig.update("compilerPathC", "clang", vscode.ConfigurationTarget.Global);
            this.globalConfig.update("compilerPathCpp", "clang++", vscode.ConfigurationTarget.Global);
        }

        this.getSettings();
    };

    public getSettings() {
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
