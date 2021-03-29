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
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("./utils");
const EXTENSION_NAME = "C_Cpp_Runner";
class SettingsProvider {
    constructor(workspacePath) {
        // Global settings
        this.config = vscode.workspace.getConfiguration(EXTENSION_NAME);
        this.plattformCategory = utils_1.getPlattformCategory();
        this.architecure = undefined;
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
        const vscodeDirectory = path.join(workspacePath, ".vscode");
        const propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");
        if (!utils_1.pathExists(propertiesPath)) {
            this.checkCompilers();
        }
        this.getSettings();
    }
    /**
     * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
     */
    checkCompilers() {
        return __awaiter(this, void 0, void 0, function* () {
            let { found: foundGcc, path: pathGcc } = yield utils_1.commandExists("gcc");
            let { found: foundGpp, path: pathGpp } = yield utils_1.commandExists("g++");
            let { found: foundClang, path: pathClang } = yield utils_1.commandExists("clang");
            let { found: foundClangpp, path: pathClangpp } = yield utils_1.commandExists("clang++");
            if (utils_1.OperatingSystems.mac === this.plattformCategory) {
                if (foundClang && pathClang) {
                    this.setClang(pathClang);
                }
                else if (foundGcc && pathGcc) {
                    this.setGcc(pathGcc);
                }
                else {
                    this.cCompiler = undefined;
                }
                if (foundClangpp && pathClangpp) {
                    this.setClangpp(pathClangpp);
                }
                else if (foundGpp && pathGpp) {
                    this.setGpp(pathGpp);
                }
                else {
                    this.cppCompiler = undefined;
                }
            }
            else if (utils_1.OperatingSystems.linux === this.plattformCategory ||
                utils_1.OperatingSystems.windows === this.plattformCategory) {
                if (foundGcc && pathGcc) {
                    this.setGcc(pathGcc);
                }
                else if (foundClang && pathClang) {
                    this.setClang(pathClang);
                }
                else {
                    this.cCompiler = undefined;
                }
                if (foundGpp && pathGpp) {
                    this.setGpp(pathGpp);
                }
                else if (foundClangpp && pathClangpp) {
                    this.setClangpp(pathClangpp);
                }
                else {
                    this.cppCompiler = undefined;
                }
            }
            else {
                this.cCompiler = undefined;
                this.cppCompiler = undefined;
            }
            if (undefined !== this.cCompiler) {
                this.architecure = utils_1.getArchitecture(this.cCompiler);
            }
        });
    }
    /**
     * Read in the current settings.
     */
    getSettings() {
        this.config = vscode.workspace.getConfiguration(EXTENSION_NAME);
        this.enableWarnings = this.config.get("enableWarnings", true);
        this.warnings = this.config.get("warnings", "-Wall -Wextra -Wpedantic");
        this.warningsAsError = this.config.get("warningsAsError", false);
        this.compilerPathC = this.config.get("compilerPathC", "gcc");
        this.compilerPathCpp = this.config.get("compilerPathCpp", "g++");
        this.makePath = this.config.get("makePath", "make");
        this.standardC = this.config.get("standardC", "c90");
        this.standardCpp = this.config.get("standardCpp", "c++11");
        const cBasename = path.basename(this.compilerPathC, "exe");
        const cppBasename = path.basename(this.compilerPathCpp, "exe");
        if (utils_1.Compilers.gcc === cBasename) {
            this.cCompiler = utils_1.Compilers.gcc;
        }
        else {
            this.cCompiler = utils_1.Compilers.clang;
        }
        if (utils_1.Compilers.gpp === cppBasename) {
            this.cppCompiler = utils_1.Compilers.gpp;
        }
        else {
            this.cppCompiler = utils_1.Compilers.clangpp;
        }
        this.architecure = utils_1.getArchitecture(this.cCompiler);
    }
    setGcc(pathGcc) {
        this.config.update("compilerPathC", pathGcc, vscode.ConfigurationTarget.Global);
        this.cCompiler = utils_1.Compilers.gcc;
    }
    setClang(pathClang) {
        this.config.update("compilerPathC", pathClang, vscode.ConfigurationTarget.Global);
        this.cCompiler = utils_1.Compilers.clang;
    }
    setGpp(pathGpp) {
        this.config.update("compilerPathCpp", pathGpp, vscode.ConfigurationTarget.Global);
        this.cppCompiler = utils_1.Compilers.gpp;
    }
    setClangpp(pathClangpp) {
        this.config.update("compilerPathCpp", pathClangpp, vscode.ConfigurationTarget.Global);
        this.cppCompiler = utils_1.Compilers.clangpp;
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settingsProvider.js.map