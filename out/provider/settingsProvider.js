"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const types_1 = require("../types");
const utils_1 = require("../utils");
const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;
class SettingsProvider {
    constructor(workspaceFolder) {
        this._config = vscode.workspace.getConfiguration('C_Cpp_Runner');
        this._operatingSystem = utils_1.getOperatingSystem();
        this._enableWarnings = true;
        this._warnings = '';
        this._warningsAsError = true;
        this._compilerPathC = '';
        this._compilerPathCpp = '';
        this._debuggerPath = '';
        this._makePath = '';
        this._standardC = '';
        this._standardCpp = '';
        this._compilerArgs = '';
        this._linkerArgs = '';
        this._includePaths = '';
        const vscodeDirectory = path.join(workspaceFolder, '.vscode');
        const propertiesPath = path.join(vscodeDirectory, 'c_cpp_properties.json');
        if (!utils_1.pathExists(propertiesPath)) {
            this.checkCompilers();
        }
        this.getSettings();
    }
    async checkCompilers() {
        const { f: foundGcc, p: pathGcc } = await utils_1.commandExists('gcc');
        const { f: foundGpp, p: pathGpp } = await utils_1.commandExists('g++');
        const { f: foundClang, p: pathClang } = await utils_1.commandExists('clang');
        const { f: foundClangpp, p: pathClangpp } = await utils_1.commandExists('clang++');
        const { f: foundGDB, p: pathGDB } = await utils_1.commandExists('gdb');
        const { f: foundLLDB, p: pathLLDB } = await utils_1.commandExists('lldb');
        const { f: foundMake, p: pathMake } = await utils_1.commandExists('make');
        if (this._operatingSystem === types_1.OperatingSystems.mac) {
            if (foundClang && pathClang) {
                this.setClang(pathClang);
            }
            else if (foundGcc && pathGcc) {
                this.setGcc(pathGcc);
            }
            else {
                this._cCompiler = undefined;
            }
            if (foundClangpp && pathClangpp) {
                this.setClangpp(pathClangpp);
            }
            else if (foundGpp && pathGpp) {
                this.setGpp(pathGpp);
            }
            else {
                this._cppCompiler = undefined;
            }
            if (foundLLDB && pathLLDB) {
                this.setLLDB(pathLLDB);
            }
            else if (foundGDB && pathGDB) {
                this.setGDB(pathGDB);
            }
            else {
                this._debugger = undefined;
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
                this._cCompiler = undefined;
            }
            if (foundGpp && pathGpp) {
                this.setGpp(pathGpp);
            }
            else if (foundClangpp && pathClangpp) {
                this.setClangpp(pathClangpp);
            }
            else {
                this._cppCompiler = undefined;
            }
            if (foundGDB && pathGDB) {
                this.setGDB(pathGDB);
            }
            else if (foundLLDB && pathLLDB) {
                this.setLLDB(pathLLDB);
            }
            else {
                this._debugger = undefined;
            }
            if (foundMake && pathMake) {
                this.setMake(pathMake);
            }
            else {
                if (this._operatingSystem === types_1.OperatingSystems.windows) {
                    const { f: foundMake, p: pathMake } = await utils_1.commandExists('mingw32-make');
                    if (foundMake && pathMake) {
                        this.setMake(pathMake);
                    }
                }
            }
        }
        if (this._cCompiler) {
            this._architecure = utils_1.getArchitecture(this._cCompiler);
        }
    }
    getSettings() {
        this._config = vscode.workspace.getConfiguration('C_Cpp_Runner');
        this._enableWarnings = this._config.get('enableWarnings', true);
        this._warnings = this._config.get('warnings', '-Wall -Wextra -Wpedantic');
        this._warningsAsError = this._config.get('warningsAsError', false);
        this._compilerPathC = this._config.get('compilerPathC', 'gcc');
        this._compilerPathCpp = this._config.get('compilerPathCpp', 'g++');
        this._debuggerPath = this._config.get('debuggerPath', 'gdb');
        this._makePath = this._config.get('makePath', 'make');
        this._standardC = this._config.get('standardC', 'c90');
        this._standardCpp = this._config.get('standardCpp', 'c++11');
        this._compilerArgs = this._config.get('compilerArgs', '');
        this._linkerArgs = this._config.get('linkerArgs', '');
        this._includePaths = this._config.get('includePaths', '');
        const cBasename = path.basename(this.compilerPathC, 'exe');
        const cppBasename = path.basename(this.compilerPathCpp, 'exe');
        if (cBasename.includes(types_1.Compilers.clang)) {
            this._cCompiler = types_1.Compilers.clang;
            this._debugger = types_1.Debuggers.lldb;
        }
        else {
            this._cCompiler = types_1.Compilers.gcc;
            this._debugger = types_1.Debuggers.gdb;
        }
        if (cppBasename.includes(types_1.Compilers.clangpp)) {
            this._cppCompiler = types_1.Compilers.clangpp;
            this._debugger = types_1.Debuggers.lldb;
        }
        else {
            this._cppCompiler = types_1.Compilers.gpp;
            this._debugger = types_1.Debuggers.gdb;
        }
        this._architecure = utils_1.getArchitecture(this._cCompiler);
    }
    setGcc(pathGcc) {
        this._config.update('compilerPathC', pathGcc, CONFIGURATION_TARGET);
        this._cCompiler = types_1.Compilers.gcc;
    }
    setClang(pathClang) {
        this._config.update('compilerPathC', pathClang, CONFIGURATION_TARGET);
        this._cCompiler = types_1.Compilers.clang;
    }
    setGpp(pathGpp) {
        this._config.update('compilerPathCpp', pathGpp, CONFIGURATION_TARGET);
        this._cppCompiler = types_1.Compilers.gpp;
    }
    setClangpp(pathClangpp) {
        this._config.update('compilerPathCpp', pathClangpp, CONFIGURATION_TARGET);
        this._cppCompiler = types_1.Compilers.clangpp;
    }
    setLLDB(pathLLDB) {
        this._config.update('debuggerPath', pathLLDB, CONFIGURATION_TARGET);
        this._debugger = types_1.Debuggers.lldb;
    }
    setGDB(pathGDB) {
        this._config.update('debuggerPath', pathGDB, CONFIGURATION_TARGET);
        this._debugger = types_1.Debuggers.gdb;
    }
    setMake(pathMake) {
        this._config.update('makePath', pathMake, CONFIGURATION_TARGET);
    }
    get operatingSystem() {
        return this._operatingSystem;
    }
    get architecure() {
        return this._architecure;
    }
    get cCompiler() {
        return this._cCompiler;
    }
    get cppCompiler() {
        return this._cppCompiler;
    }
    get debugger() {
        return this._debugger;
    }
    get enableWarnings() {
        return this._enableWarnings;
    }
    get warnings() {
        return this._warnings;
    }
    get warningsAsError() {
        return this._warningsAsError;
    }
    get compilerPathC() {
        return this._compilerPathC;
    }
    get compilerPathCpp() {
        return this._compilerPathCpp;
    }
    get debuggerPath() {
        return this._debuggerPath;
    }
    get makePath() {
        return this._makePath;
    }
    get standardC() {
        return this._standardC;
    }
    get standardCpp() {
        return this._standardCpp;
    }
    get compilerArgs() {
        return this._compilerArgs;
    }
    get linkerArgs() {
        return this._linkerArgs;
    }
    get includePaths() {
        return this._includePaths;
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=settingsProvider.js.map