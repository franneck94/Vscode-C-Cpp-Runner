"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        this.cCompiler = undefined;
        this.cppCompiler = undefined;
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
        return __awaiter(this, void 0, void 0, function* () {
            if (this.plattformCategory === 'macos') {
                let { found: foundGcc, path: pathGcc } = yield utils_1.commandExists('gcc');
                let { found: foundGpp, path: pathGpp } = yield utils_1.commandExists('g++');
                let { found: foundClang, path: pathClang } = yield utils_1.commandExists('clang');
                let { found: foundClangpp, path: pathClangpp } = yield utils_1.commandExists('clang++');
                if (foundClang) {
                    this.config.update("compilerPathC", pathClang, vscode.ConfigurationTarget.Global);
                    this.cCompiler = "clang";
                }
                else if (foundGcc) {
                    this.config.update("compilerPathC", pathGcc, vscode.ConfigurationTarget.Global);
                    this.cCompiler = "gcc";
                }
                else {
                    // TODO
                    this.cCompiler = undefined;
                }
                if (foundClangpp) {
                    this.config.update("compilerPathCpp", pathClangpp, vscode.ConfigurationTarget.Global);
                    this.cppCompiler = "clang++";
                }
                else if (foundGpp) {
                    this.config.update("compilerPathCpp", pathGpp, vscode.ConfigurationTarget.Global);
                    this.cppCompiler = "g++";
                }
                else {
                    // TODO
                    this.cppCompiler = undefined;
                }
            }
            else if (this.plattformCategory === 'linux' ||
                this.plattformCategory === 'windows') {
                let { found: foundGcc, path: pathGcc } = yield utils_1.commandExists('gcc');
                let { found: foundGpp, path: pathGpp } = yield utils_1.commandExists('g++');
                let { found: foundClang, path: pathClang } = yield utils_1.commandExists('clang');
                let { found: foundClangpp, path: pathClangpp } = yield utils_1.commandExists('clang++');
                if (foundGcc) {
                    this.config.update("compilerPathC", pathGcc, vscode.ConfigurationTarget.Global);
                    this.cCompiler = "gcc";
                }
                else if (foundClang) {
                    this.config.update("compilerPathC", pathClang, vscode.ConfigurationTarget.Global);
                    this.cCompiler = "clang";
                }
                else {
                    // TODO
                    this.cCompiler = undefined;
                }
                if (foundGpp) {
                    this.config.update("compilerPathCpp", pathGpp, vscode.ConfigurationTarget.Global);
                    this.cppCompiler = "g++";
                }
                else if (foundClangpp) {
                    this.config.update("compilerPathCpp", pathClangpp, vscode.ConfigurationTarget.Global);
                    this.cppCompiler = "clang++";
                }
                else {
                    // TODO
                    this.cppCompiler = undefined;
                }
            }
            else {
                // TODO
            }
        });
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
//# sourceMappingURL=settingsProvider.js.map