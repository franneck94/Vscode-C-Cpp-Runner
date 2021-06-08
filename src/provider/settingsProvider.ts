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
  // Workspace data
  private _configLocal: JsonSettings | undefined;
  private _configGlobal = vscode.workspace.getConfiguration(EXTENSION_NAME);
  // Machine information
  private _operatingSystem = getOperatingSystem();
  private _architecure: Architectures | undefined;
  private _isCygwin: boolean | undefined;
  private _cCompiler: Compilers | undefined;
  private _cppCompiler: Compilers | undefined;
  private _debugger: Debuggers | undefined;
  private _cCompilerFound: boolean = false;
  private _cppCompilerFound: boolean = false;
  private _foundMake: boolean = false;
  private _foundDebugger: boolean = false;
  // Settings
  private _cCompilerPath: string = 'gcc';
  private _cppCompilerPath: string = 'g++';
  private _debuggerPath: string = 'gdb';
  private _makePath: string = 'make';
  private _cStandard: string = '';
  private _cppStandard: string = '';
  private _compilerArgs: string = '';
  private _linkerArgs: string = '';
  private _includePaths: String = '';
  private _enableWarnings: boolean = true;
  private _warningsAsError: boolean = false;
  private _warnings: string = '-Wall -Wextra -Wpedantic';

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

    this._enableWarnings = this.getSettingsValue('enableWarnings', false);
    this._warnings = this.getSettingsValue('warnings', '');
    this._warningsAsError = this.getSettingsValue('warningsAsError', false);
    this._cCompilerPath = this.getSettingsValue('cCompilerPath', '');
    this._cppCompilerPath = this.getSettingsValue('cppCompilerPath', '');
    this._debuggerPath = this.getSettingsValue('debuggerPath', '');
    this._makePath = this.getSettingsValue('makePath', '');
    this._cStandard = this.getSettingsValue('cStandard', '');
    this._cppStandard = this.getSettingsValue('cppStandard', '');
    this._compilerArgs = this.getSettingsValue('compilerArgs', '');
    this._linkerArgs = this.getSettingsValue('linkerArgs', '');
    this._includePaths = this.getSettingsValue('includePaths', '');

    this.setCommands();
  }

  private getSettingsValue(name: string, defaultValue: any) {
    const settingName = `${EXTENSION_NAME}.${name}`;

    if (this._configLocal && this._configLocal[settingName]) {
      return this._configLocal[settingName];
    }

    if (this._configGlobal.has(name)) {
      return this._configGlobal.get(name, defaultValue);
    }

    return defaultValue;
  }

  private setCommands() {
    let cBasename: string;
    let cppBasename: string;

    if (this.operatingSystem === OperatingSystems.windows) {
      cBasename = path.basename(this.cCompilerPath, 'exe');
      cppBasename = path.basename(this.cppCompilerPath, 'exe');
    } else {
      cBasename = path.basename(this.cCompilerPath);
      cppBasename = path.basename(this.cppCompilerPath);
    }

    if (cBasename.includes(Compilers.clang)) {
      this._cCompiler = Compilers.clang;
      this._debugger = Debuggers.lldb;
    } else {
      this._cCompiler = Compilers.gcc;
      this._debugger = Debuggers.gdb;
    }

    if (cppBasename.includes(Compilers.clangpp)) {
      this._cppCompiler = Compilers.clangpp;
      this._debugger = Debuggers.lldb;
    } else {
      this._cppCompiler = Compilers.gpp;
      this._debugger = Debuggers.gdb;
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
      if (!settingsJson.settingName) {
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

  public deleteCallback() {
    this.getCommands();
  }

  public changeCallback() {
    this.getSettings();
  }

  private setGcc(pathGcc: string) {
    this.update('cCompilerPath', pathGcc);
    this._cCompiler = Compilers.gcc;
    this._cCompilerFound = true;
  }

  private setClang(pathClang: string) {
    this.update('cCompilerPath', pathClang);
    this._cCompiler = Compilers.clang;
    this._cCompilerFound = true;
  }

  private setGpp(pathGpp: string) {
    this.update('cppCompilerPath', pathGpp);
    this._cppCompiler = Compilers.gpp;
    this._cppCompilerFound = true;
  }

  private setClangpp(pathClangpp: string) {
    this.update('cppCompilerPath', pathClangpp);
    this._cppCompiler = Compilers.clangpp;
    this._cppCompilerFound = true;
  }

  private setLLDB(pathLLDB: string) {
    this.update('debuggerPath', pathLLDB);
    this._debugger = Debuggers.lldb;
    this._foundDebugger = true;
  }

  private setGDB(pathGDB: string) {
    this.update('debuggerPath', pathGDB);
    this._debugger = Debuggers.gdb;
    this._foundDebugger = true;
  }

  private setMake(pathMake: string) {
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
}
