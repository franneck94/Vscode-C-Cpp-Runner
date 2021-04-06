"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils");
const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;
class SettingsProvider {
    constructor(Global) {
        this._config = vscode.workspace.getConfiguration('C_Cpp_Runner');
        this.operatingSystem = utils_1.getOperatingSystem();
        this.enableWarnings = true;
        this.warnings = '';
        this.warningsAsError = true;
        this.compilerPathC = '';
        this.compilerPathCpp = '';
        this.debuggerPath = '';
        this.makePath = '';
        this.standardC = '';
        this.standardCpp = '';
        this.compilerArgs = '';
        this.linkerArgs = '';
        this.includePaths = '';
        const vscodeDirectory = path.join(Global, '.vscode');
        const propertiesPath = path.join(vscodeDirectory, 'c_cpp_properties.json');
        if (!utils_1.pathExists(propertiesPath)) {
            this.checkCompilers();
        }
        this.getSettings();
    }
    async checkCompilers() {
        const { found: foundGcc, path: pathGcc } = await utils_1.commandExists('gcc');
        const { found: foundGpp, path: pathGpp } = await utils_1.commandExists('g++');
        const { found: foundClang, path: pathClang } = await utils_1.commandExists('clang');
        const { found: foundClangpp, path: pathClangpp } = await utils_1.commandExists('clang++');
        const { found: foundGDB, path: pathGDB } = await utils_1.commandExists('gdb');
        const { found: foundLLDB, path: pathLLDB } = await utils_1.commandExists('lldb');
        const { found: foundMake, path: pathMake } = await utils_1.commandExists('make');
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
            else {
                if (this.operatingSystem === utils_1.OperatingSystems.windows) {
                    const { found: foundMakeMingw, path: pathMakeMingw, } = await utils_1.commandExists('mingw32-make');
                    if (foundMakeMingw && pathMakeMingw) {
                        this.setMake(pathMakeMingw);
                    }
                }
            }
        }
        if (undefined !== this.cCompiler) {
            this.architecure = utils_1.getArchitecture(this.cCompiler);
        }
    }
    getSettings() {
        this._config = vscode.workspace.getConfiguration('C_Cpp_Runner');
        this.enableWarnings = this._config.get('enableWarnings', true);
        this.warnings = this._config.get('warnings', '-Wall -Wextra -Wpedantic');
        this.warningsAsError = this._config.get('warningsAsError', false);
        this.compilerPathC = this._config.get('compilerPathC', 'gcc');
        this.compilerPathCpp = this._config.get('compilerPathCpp', 'g++');
        this.debuggerPath = this._config.get('debuggerPath', 'gdb');
        this.makePath = this._config.get('makePath', 'make');
        this.standardC = this._config.get('standardC', 'c90');
        this.standardCpp = this._config.get('standardCpp', 'c++11');
        this.compilerArgs = this._config.get('compilerArgs', '');
        this.linkerArgs = this._config.get('linkerArgs', '');
        this.includePaths = this._config.get('includePaths', '');
        const cBasename = path.basename(this.compilerPathC, 'exe');
        const cppBasename = path.basename(this.compilerPathCpp, 'exe');
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
        this._config.update('compilerPathC', pathGcc, CONFIGURATION_TARGET);
        this.cCompiler = utils_1.Compilers.gcc;
    }
    setClang(pathClang) {
        this._config.update('compilerPathC', pathClang, CONFIGURATION_TARGET);
        this.cCompiler = utils_1.Compilers.clang;
    }
    setGpp(pathGpp) {
        this._config.update('compilerPathCpp', pathGpp, CONFIGURATION_TARGET);
        this.cppCompiler = utils_1.Compilers.gpp;
    }
    setClangpp(pathClangpp) {
        this._config.update('compilerPathCpp', pathClangpp, CONFIGURATION_TARGET);
        this.cppCompiler = utils_1.Compilers.clangpp;
    }
    setLLDB(pathLLDB) {
        this._config.update('debuggerPath', pathLLDB, CONFIGURATION_TARGET);
        this.debugger = utils_1.Debuggers.lldb;
    }
    setGDB(pathGDB) {
        this._config.update('debuggerPath', pathGDB, CONFIGURATION_TARGET);
        this.debugger = utils_1.Debuggers.gdb;
    }
    setMake(pathMake) {
        this._config.update('makePath', pathMake, CONFIGURATION_TARGET);
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settingsProvider.js.map