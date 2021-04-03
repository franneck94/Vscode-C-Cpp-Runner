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
const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;
class SettingsProvider {
    constructor(Global) {
        // Global settings
        this.config = vscode.workspace.getConfiguration(EXTENSION_NAME);
        this.operatingSystem = utils_1.getOperatingSystem();
        // Settings
        this.enableWarnings = true;
        this.warnings = "";
        this.warningsAsError = true;
        this.compilerPathC = "";
        this.compilerPathCpp = "";
        this.debuggerPath = "";
        this.makePath = "";
        this.standardC = "";
        this.standardCpp = "";
        this.compilerArgs = "";
        this.linkerArgs = "";
        this.includePaths = "";
        const vscodeDirectory = path.join(Global, ".vscode");
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
            const { found: foundGcc, path: pathGcc } = yield utils_1.commandExists("gcc");
            const { found: foundGpp, path: pathGpp } = yield utils_1.commandExists("g++");
            const { found: foundClang, path: pathClang } = yield utils_1.commandExists("clang");
            const { found: foundClangpp, path: pathClangpp } = yield utils_1.commandExists("clang++");
            const { found: foundGDB, path: pathGDB } = yield utils_1.commandExists("gdb");
            const { found: foundLLDB, path: pathLLDB } = yield utils_1.commandExists("lldb");
            const { found: foundMake, path: pathMake } = yield utils_1.commandExists("make");
            if (utils_1.OperatingSystems.mac === this.operatingSystem) {
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
                if (foundLLDB && pathLLDB) {
                    this.setLLDB(pathLLDB);
                }
                else if (foundGDB && pathGDB) {
                    this.setGDB(pathGDB);
                }
                else {
                    this.debugger = undefined;
                }
            }
            else {
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
                if (foundGDB && pathGDB) {
                    this.setGDB(pathGDB);
                }
                else if (foundLLDB && pathLLDB) {
                    this.setLLDB(pathLLDB);
                }
                else {
                    this.debugger = undefined;
                }
                if (foundMake && pathMake) {
                    this.setMake(pathMake);
                }
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
        this.debuggerPath = this.config.get("debuggerPath", "gdb");
        this.makePath = this.config.get("makePath", "make");
        this.standardC = this.config.get("standardC", "c90");
        this.standardCpp = this.config.get("standardCpp", "c++11");
        this.compilerArgs = this.config.get("compilerArgs", "");
        this.linkerArgs = this.config.get("linkerArgs", "");
        this.includePaths = this.config.get("includePaths", "");
        const cBasename = path.basename(this.compilerPathC, "exe");
        const cppBasename = path.basename(this.compilerPathCpp, "exe");
        if (cBasename.includes(utils_1.Compilers.clang)) {
            this.cCompiler = utils_1.Compilers.clang;
            this.debugger = utils_1.Debuggers.lldb;
        }
        else {
            this.cCompiler = utils_1.Compilers.gcc;
            this.debugger = utils_1.Debuggers.gdb;
        }
        if (cppBasename.includes(utils_1.Compilers.clangpp)) {
            this.cppCompiler = utils_1.Compilers.clangpp;
            this.debugger = utils_1.Debuggers.lldb;
        }
        else {
            this.cppCompiler = utils_1.Compilers.gpp;
            this.debugger = utils_1.Debuggers.gdb;
        }
        this.architecure = utils_1.getArchitecture(this.cCompiler);
    }
    setGcc(pathGcc) {
        this.config.update("compilerPathC", pathGcc, CONFIGURATION_TARGET);
        this.cCompiler = utils_1.Compilers.gcc;
    }
    setClang(pathClang) {
        this.config.update("compilerPathC", pathClang, CONFIGURATION_TARGET);
        this.cCompiler = utils_1.Compilers.clang;
    }
    setGpp(pathGpp) {
        this.config.update("compilerPathCpp", pathGpp, CONFIGURATION_TARGET);
        this.cppCompiler = utils_1.Compilers.gpp;
    }
    setClangpp(pathClangpp) {
        this.config.update("compilerPathCpp", pathClangpp, CONFIGURATION_TARGET);
        this.cppCompiler = utils_1.Compilers.clangpp;
    }
    setLLDB(pathLLDB) {
        this.config.update("debuggerPath", pathLLDB, CONFIGURATION_TARGET);
        this.debugger = utils_1.Debuggers.lldb;
    }
    setGDB(pathGDB) {
        this.config.update("debuggerPath", pathGDB, CONFIGURATION_TARGET);
        this.debugger = utils_1.Debuggers.gdb;
    }
    setMake(pathMake) {
        this.config.update("makePath", pathMake, CONFIGURATION_TARGET);
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settingsProvider.js.map