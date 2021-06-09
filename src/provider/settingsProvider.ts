import * as path from 'path';
import * as vscode from 'vscode';

import {
  commandCheck,
  mkdirRecursive,
  pathExists,
  readJsonFile,
  writeJsonFile,
} from '../utils/fileUtils';
import {
  commandExists,
  getArchitecture,
  getOperatingSystem,
} from '../utils/systemUtils';
import {
  Architectures,
  Compilers,
  Debuggers,
  JsonSettings,
  Makefiles,
  OperatingSystems,
} from '../utils/types';
import { CallbackProvider } from './callbackProvider';

const TEMPLATE_FILENAME = 'settings.json';
const OUTPUT_FILENAME = 'settings.json';
const EXTENSION_NAME = 'C_Cpp_Runner';

export class SettingsProvider extends CallbackProvider {
  static DEFAULT_C_COMPILER_PATH = 'gcc';
  static DEFAULT_CPP_COMPILER_PATH = 'g++';
  static DEFAULT_DEBUGGER_PATH = 'gdb';
  static DEFAULT_MAKE_PATH = 'make';
  static DEFAULT_C_STANDARD = '';
  static DEFAULT_CPP_STANDARD = '';
  static DEFAULT_COMPILER_ARGS = '';
  static DEFAULT_LINKER_ARGS = '';
  static DEFAULT_INCLUDE_PATHS = '';
  static DEFAULT_ENABLE_WARNINGS = true;
  static DEFAULT_WARNINGS_AS_ERRORS = false;
  static DEFAULT_WARNINGS = '-Wall -Wextra -Wpedantic';

  // Workspace data
  private _configLocal: JsonSettings | undefined;
  private _configGlobal = vscode.workspace.getConfiguration(EXTENSION_NAME);
  // Machine information
  private _operatingSystem = getOperatingSystem();
  private _architecure: Architectures | undefined;
  private _isCygwin: boolean = false;
  private _cCompiler: Compilers | undefined;
  private _cppCompiler: Compilers | undefined;
  private _debugger: Debuggers | undefined;
  private _cCompilerFound: boolean = false;
  private _cppCompilerFound: boolean = false;
  private _foundMake: boolean = false;
  private _foundDebugger: boolean = false;
  // Settings
  private _cCompilerPath: string = SettingsProvider.DEFAULT_C_COMPILER_PATH;
  private _cppCompilerPath: string = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
  private _debuggerPath: string = SettingsProvider.DEFAULT_DEBUGGER_PATH;
  private _makePath: string = SettingsProvider.DEFAULT_MAKE_PATH;
  private _cStandard: string = SettingsProvider.DEFAULT_C_STANDARD;
  private _cppStandard: string = SettingsProvider.DEFAULT_CPP_STANDARD;
  private _compilerArgs: string = SettingsProvider.DEFAULT_COMPILER_ARGS;
  private _linkerArgs: string = SettingsProvider.DEFAULT_LINKER_ARGS;
  private _includePaths: string = SettingsProvider.DEFAULT_INCLUDE_PATHS;
  private _enableWarnings: boolean = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
  private _warningsAsError: boolean =
    SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
  private _warnings: string = SettingsProvider.DEFAULT_WARNINGS;

  constructor(public workspaceFolder: string) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    this.readLocalConfig();
    this.getCommands();
    this.getSettings();
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  public async getCommands() {
    if (pathExists(this._outputPath)) {
      const settingsJson: JsonSettings | undefined = readJsonFile(
        this._outputPath,
      );

      if (!settingsJson) return;

      let settingsExist = false;

      if (
        commandCheck(`${EXTENSION_NAME}.cCompilerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.cppCompilerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.debuggerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.makePath`, settingsJson)
      ) {
        settingsExist = true;
      }

      let commandsExist = false;

      if (
        this._cCompilerFound &&
        this._cppCompilerFound &&
        this._foundMake &&
        this._foundDebugger
      ) {
        commandsExist = true;
      }

      if (settingsExist || (settingsExist && commandsExist)) {
        return;
      }
    }

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    const { f: foundGcc, p: pathGcc } = await commandExists(Compilers.gcc);
    const { f: foundGpp, p: pathGpp } = await commandExists(Compilers.gpp);
    const { f: foundGDB, p: pathGDB } = await commandExists(Debuggers.gdb);
    const { f: foundMake, p: pathMake } = await commandExists(Makefiles.make);

    if (foundGcc && pathGcc) {
      this.setGcc(pathGcc);
    } else {
      const { f: foundClang, p: pathClang } = await commandExists(
        Compilers.clang,
      );

      if (foundClang && pathClang) {
        this.setClang(pathClang);
      } else {
        this._cCompiler = undefined;
      }
    }

    if (foundGpp && pathGpp) {
      this.setGpp(pathGpp);
    } else {
      const { f: foundClangpp, p: pathClangpp } = await commandExists(
        Compilers.clangpp,
      );

      if (foundClangpp && pathClangpp) {
        this.setClangpp(pathClangpp);
      } else {
        this._cppCompiler = undefined;
      }
    }

    if (foundGDB && pathGDB) {
      this.setGDB(pathGDB);
    } else {
      const { f: foundLLDB, p: pathLLDB } = await commandExists(Debuggers.lldb);

      if (foundLLDB && pathLLDB) {
        this.setLLDB(pathLLDB);
      } else {
        this._debugger = undefined;
      }
    }

    if (foundMake && pathMake) {
      this.setMake(pathMake);
    } else if (this._operatingSystem === OperatingSystems.windows) {
      const { f: foundMake, p: pathMake } = await commandExists(
        Makefiles.makeMinGW,
      );
      if (foundMake && pathMake) {
        this.setMake(pathMake);
      } else {
        this._foundMake = false;
      }
    }

    this.updateArchitecture();
  }

  /**
   * Read in the current settings.
   */
  public getSettings() {
    this.readLocalConfig();

    /* Mandatory Settings in settings.json */
    this._cCompilerPath = this.getSettingsValue(
      'cCompilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );
    this._cppCompilerPath = this.getSettingsValue(
      'cppCompilerPath',
      SettingsProvider.DEFAULT_CPP_COMPILER_PATH,
    );
    this._debuggerPath = this.getSettingsValue(
      'debuggerPath',
      SettingsProvider.DEFAULT_DEBUGGER_PATH,
    );
    this._makePath = this.getSettingsValue(
      'makePath',
      SettingsProvider.DEFAULT_MAKE_PATH,
    );

    /* Optional Settings in settings.json */
    this._enableWarnings = this.getSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this._warnings = this.getSettingsValue(
      'warnings',
      SettingsProvider.DEFAULT_WARNINGS,
    );
    this._warningsAsError = this.getSettingsValue(
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );
    this._cStandard = this.getSettingsValue(
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD,
    );
    this._cppStandard = this.getSettingsValue(
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );
    this._compilerArgs = this.getSettingsValue(
      'compilerArgs',
      SettingsProvider.DEFAULT_COMPILER_ARGS,
    );
    this._linkerArgs = this.getSettingsValue(
      'linkerArgs',
      SettingsProvider.DEFAULT_LINKER_ARGS,
    );
    this._includePaths = this.getSettingsValue(
      'includePaths',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );

    this.checkSettingsDelete();
    this.setCommands();
  }

  private getSettingsValue(name: string, defaultValue: any) {
    const settingName = `${EXTENSION_NAME}.${name}`;

    if (this._configLocal && this._configLocal[settingName] !== undefined) {
      return this._configLocal[settingName];
    }

    if (this._configGlobal.has(name)) {
      return this._configGlobal.get(name, defaultValue);
    }

    return defaultValue;
  }

  private setCommands() {
    let cBasename: string = this.cCompilerPath;
    let cppBasename: string = this.cppCompilerPath;

    if (cBasename.includes('/') || cBasename.includes('\\')) {
      cBasename = path.basename(cBasename);
    }
    if (cBasename.includes('.exe')) {
      cBasename = cBasename.replace('.exe', '');
    }

    if (cppBasename.includes('/') || cppBasename.includes('\\')) {
      cppBasename = path.basename(cppBasename);
    }
    if (cppBasename.includes('.exe')) {
      cppBasename = cppBasename.replace('.exe', '');
    }

    if (cBasename) {
      if (cBasename.includes(Compilers.clang)) {
        this._cCompiler = Compilers.clang;
        this._debugger = Debuggers.lldb;
      } else {
        this._cCompiler = Compilers.gcc;
        this._debugger = Debuggers.gdb;
      }
    }

    if (cppBasename) {
      if (cppBasename.includes(Compilers.clangpp)) {
        this._cppCompiler = Compilers.clangpp;
        this._debugger = Debuggers.lldb;
      } else {
        this._cppCompiler = Compilers.gpp;
        this._debugger = Debuggers.gdb;
      }
    }

    this.updateArchitecture();
  }

  public updateFolderData(workspaceFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this._vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, OUTPUT_FILENAME);

    this.readLocalConfig();
    this.createFileWatcher();
  }

  private readLocalConfig() {
    this._configLocal = readJsonFile(this._outputPath);
  }

  public update(key: string, value: any) {
    let settingsJson: JsonSettings | undefined = readJsonFile(this._outputPath);

    if (!settingsJson) {
      settingsJson = {};
    }

    const settingName = `${EXTENSION_NAME}.${key}`;

    try {
      if (!settingsJson[settingName]) {
        settingsJson[settingName] = value;
      }

      writeJsonFile(this._outputPath, settingsJson);
    } catch (error) {
      console.log(error);
    }
  }

  private updateArchitecture() {
    if (this._cCompiler) {
      const ret = getArchitecture(this._cCompiler);
      this._architecure = ret.architecure;
      this._isCygwin = ret.isCygwin;
    } else if (this._cppCompiler) {
      const ret = getArchitecture(this._cppCompiler);
      this._architecure = ret.architecure;
      this._isCygwin = ret.isCygwin;
    }
  }

  private checkSettingsDelete() {
    let settingsJson: JsonSettings | undefined = readJsonFile(this._outputPath);

    if (!settingsJson) return;

    let doUpdate = false;

    if (!settingsJson[`${EXTENSION_NAME}.cCompilerPath`]) doUpdate = true;
    if (!settingsJson[`${EXTENSION_NAME}.cppCompilerPath`]) doUpdate = true;
    if (!settingsJson[`${EXTENSION_NAME}.debuggerPath`]) doUpdate = true;
    if (!settingsJson[`${EXTENSION_NAME}.makePath`]) doUpdate = true;

    if (doUpdate) {
      this.getCommands();
    }
  }

  public deleteCallback() {
    this.getCommands();
  }

  public changeCallback() {
    this.getSettings();
  }

  public setGcc(pathGcc: string) {
    this.update('cCompilerPath', pathGcc);
    this._cCompiler = Compilers.gcc;
    this._cCompilerFound = true;
  }

  public setClang(pathClang: string) {
    this.update('cCompilerPath', pathClang);
    this._cCompiler = Compilers.clang;
    this._cCompilerFound = true;
  }

  public setGpp(pathGpp: string) {
    this.update('cppCompilerPath', pathGpp);
    this._cppCompiler = Compilers.gpp;
    this._cppCompilerFound = true;
  }

  public setClangpp(pathClangpp: string) {
    this.update('cppCompilerPath', pathClangpp);
    this._cppCompiler = Compilers.clangpp;
    this._cppCompilerFound = true;
  }

  public setLLDB(pathLLDB: string) {
    this.update('debuggerPath', pathLLDB);
    this._debugger = Debuggers.lldb;
    this._foundDebugger = true;
  }

  public setGDB(pathGDB: string) {
    this.update('debuggerPath', pathGDB);
    this._debugger = Debuggers.gdb;
    this._foundDebugger = true;
  }

  public setMake(pathMake: string) {
    this.update('makePath', pathMake);
    this._foundMake = true;
  }

  public get operatingSystem() {
    return this._operatingSystem;
  }

  public get architecure() {
    return this._architecure;
  }

  public get isCygwin() {
    return this._isCygwin;
  }

  public get cCompiler() {
    return this._cCompiler;
  }

  public get cppCompiler() {
    return this._cppCompiler;
  }

  public get debugger() {
    return this._debugger;
  }

  public get enableWarnings() {
    return this._enableWarnings;
  }

  public get warnings() {
    return this._warnings;
  }

  public get warningsAsError() {
    return this._warningsAsError;
  }

  public get cCompilerPath() {
    return this._cCompilerPath;
  }

  public get cppCompilerPath() {
    return this._cppCompilerPath;
  }

  public get debuggerPath() {
    return this._debuggerPath;
  }

  public get makePath() {
    return this._makePath;
  }

  public get cStandard() {
    return this._cStandard;
  }

  public get cppStandard() {
    return this._cppStandard;
  }

  public get compilerArgs() {
    return this._compilerArgs;
  }

  public get linkerArgs() {
    return this._linkerArgs;
  }

  public get includePaths() {
    return this._includePaths;
  }

  public set cppCompilerPath(newPath: string) {
    this._cppCompilerPath = newPath;
  }

  public set cCompilerPath(newPath: string) {
    this._cCompilerPath = newPath;
  }

  public set cStandard(newStandard: string) {
    this._cStandard = newStandard;
  }

  public set cppStandard(newStandard: string) {
    this._cppStandard = newStandard;
  }

  public set debuggerPath(newPath: string) {
    this._debuggerPath = newPath;
  }

  public set warnings(newWarnings: string) {
    this._warnings = newWarnings;
  }

  public set compilerArgs(newArgs: string) {
    this._compilerArgs = newArgs;
  }

  public set includePaths(newPaths: string) {
    this._includePaths = newPaths;
  }
}
