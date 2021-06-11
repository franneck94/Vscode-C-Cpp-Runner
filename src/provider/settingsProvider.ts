import * as path from 'path';
import * as vscode from 'vscode';

import {
  commandCheck,
  getBasename,
  mkdirRecursive,
  pathExists,
  readJsonFile,
  removeExtension,
  writeJsonFile,
} from '../utils/fileUtils';
import {
  commandExists,
  getArchitectureCommand,
  getOperatingSystem,
} from '../utils/systemUtils';
import {
  Architectures,
  Compilers,
  Debuggers,
  JsonSettings,
  Makefiles,
  OperatingSystems,
  CompilerSystems,
  Commands,
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
  private _commands: Commands | undefined;
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

    this.createVscodeFolder();
    this.updateSettings();
  }

  private createVscodeFolder() {
    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }
  }

  private commandsStored() {
    if (pathExists(this._outputPath)) {
      const settingsJson: JsonSettings | undefined = readJsonFile(
        this._outputPath,
      );

      if (!settingsJson) return false;

      if (
        commandCheck(`${EXTENSION_NAME}.cCompilerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.cppCompilerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.debuggerPath`, settingsJson) &&
        commandCheck(`${EXTENSION_NAME}.makePath`, settingsJson)
      ) {
        return true;
      }

      if (
        this._cCompilerFound &&
        this._cppCompilerFound &&
        this._foundMake &&
        this._foundDebugger
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  public async getCommands() {
    let foundGcc = false;
    let foundGpp = false;
    let foundGDB = false;
    let foundMake = false;
    let foundClang = false;
    let foundClangpp = false;
    let foundLLDB = false;

    let pathGcc: string | undefined;
    let pathGpp: string | undefined;
    let pathGDB: string | undefined;
    let pathMake: string | undefined;
    let pathClang: string | undefined;
    let pathClangpp: string | undefined;
    let pathLLDB: string | undefined;

    const env = process.env;
    if (this.operatingSystem === OperatingSystems.windows && env.PATH) {
      const paths = env.PATH.split(';');
      for (let env_path of paths) {
        if (
          (foundGcc && foundGpp && foundGDB) ||
          (foundClang && foundClangpp && foundLLDB)
        ) {
          break;
        }
        const lower_path = env_path.toLocaleLowerCase();
        if (
          lower_path.includes('bin') &&
          (lower_path.includes(CompilerSystems.cygwin) ||
            lower_path.includes(CompilerSystems.mingw) ||
            lower_path.includes(CompilerSystems.msys2))
        ) {
          pathGcc = path.join(env_path, Compilers.gcc + '.exe');
          pathGpp = path.join(env_path, Compilers.gpp + '.exe');
          pathGDB = path.join(env_path, Debuggers.gdb + '.exe');
          pathMake = path.join(env_path, Makefiles.make + '.exe');

          if (pathExists(pathGcc)) {
            foundGcc = true;
          }
          if (pathExists(pathGpp)) {
            foundGpp = true;
          }
          if (pathExists(pathGDB)) {
            foundGDB = true;
          }
          if (pathExists(pathMake)) {
            foundMake = true;
          } else {
            const altpathMake = path.join(
              env_path,
              Makefiles.make_mingw + '.exe',
            );

            if (pathExists(altpathMake)) {
              foundMake = true;
            }
          }
        } else if (
          lower_path.includes('bin') &&
          lower_path.includes(CompilerSystems.clang)
        ) {
          pathClang = path.join(env_path, Compilers.clang + '.exe');
          pathClangpp = path.join(env_path, Compilers.clangpp + '.exe');
          pathLLDB = path.join(env_path, Debuggers.lldb + '.exe');
          pathMake = path.join(env_path, Makefiles.make + '.exe');

          if (pathExists(pathClang)) {
            foundClang = true;
          }
          if (pathExists(pathClangpp)) {
            foundClangpp = true;
          }
          if (pathExists(pathLLDB)) {
            foundLLDB = true;
          }
          if (pathExists(pathMake)) {
            foundMake = true;
          }
        }
      }
    }

    if (!foundGcc) {
      ({ f: foundGcc, p: pathGcc } = await commandExists(Compilers.gcc));
    }
    if (!foundGcc) {
      ({ f: foundClang, p: pathClang } = await commandExists(Compilers.clang));
    }

    if (!foundGpp) {
      ({ f: foundGpp, p: pathGpp } = await commandExists(Compilers.gpp));
    }
    if (!foundGpp) {
      ({ f: foundClangpp, p: pathClangpp } = await commandExists(
        Compilers.clangpp,
      ));
    }

    if (!foundGDB) {
      ({ f: foundGDB, p: pathGDB } = await commandExists(Debuggers.gdb));
    }
    if (!foundGDB) {
      ({ f: foundLLDB, p: pathLLDB } = await commandExists(Debuggers.lldb));
    }

    if (!foundMake) {
      ({ f: foundMake, p: pathMake } = await commandExists(Makefiles.make));
    }
    if (!foundMake && this._operatingSystem === OperatingSystems.windows) {
      ({ f: foundMake, p: pathMake } = await commandExists(
        Makefiles.make_mingw,
      ));
    }

    this._commands = {
      foundGcc,
      pathGcc,
      foundGpp,
      pathGpp,
      foundClang,
      pathClang,
      foundClangpp,
      pathClangpp,
      foundGDB,
      pathGDB,
      foundLLDB,
      pathLLDB,
      foundMake,
      pathMake,
    };
  }

  private setCommands() {
    if (!this._commands) return;

    if (this._commands.foundGcc && this._commands.pathGcc) {
      this.setGcc(this._commands.pathGcc);
    } else if (this._commands.foundClang && this._commands.pathClang) {
      this.setClang(this._commands.pathClang);
    } else {
      this._cCompiler = undefined;
    }

    if (this._commands.foundGpp && this._commands.pathGpp) {
      this.setGpp(this._commands.pathGpp);
    } else if (this._commands.foundClangpp && this._commands.pathClangpp) {
      this.setClangpp(this._commands.pathClangpp);
    } else {
      this._cppCompiler = undefined;
    }

    if (this._commands.foundGDB && this._commands.pathGDB) {
      this.setGDB(this._commands.pathGDB);
    } else if (this._commands.foundLLDB && this._commands.pathLLDB) {
      this.setLLDB(this._commands.pathLLDB);
    } else {
      this._debugger = undefined;
    }

    if (this._commands.foundMake && this._commands.pathMake) {
      this.setMake(this._commands.pathMake);
    } else if (this._commands.foundMake && this._commands.pathMake) {
      this.setMake(this._commands.pathMake);
    } else {
      this._foundMake = false;
    }
  }

  /**
   * Read in the current settings.
   */
  public updateSettings() {
    this.readLocalConfig();
    this.getSettings();
    if (!this.commandsStored()) {
      this.getCommands();
      this.setCommands();
    }
    this.getCommandTypes();
    this.getArchitecture();
  }

  private getSettings() {
    /* Mandatory in settings.json */
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

    /* Optional in settings.json */
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

  private getCommandTypes() {
    let cBasename: string = this.cCompilerPath;
    let cppBasename: string = this.cppCompilerPath;

    cBasename = getBasename(cBasename);
    cBasename = removeExtension(cBasename, 'exe');

    cppBasename = getBasename(cppBasename);
    cppBasename = removeExtension(cBasename, 'exe');

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

    settingsJson[settingName] = value;

    writeJsonFile(this._outputPath, settingsJson);
  }

  private getArchitecture() {
    if (this._cCompiler) {
      const ret = getArchitectureCommand(this._cCompiler);
      this._architecure = ret.architecure;
      this._isCygwin = ret.isCygwin;
    } else if (this._cppCompiler) {
      const ret = getArchitectureCommand(this._cppCompiler);
      this._architecure = ret.architecure;
      this._isCygwin = ret.isCygwin;
    }
  }

  public deleteCallback() {
    this.createVscodeFolder();
    if (!this.commandsStored()) {
      this.getCommands();
      this.setCommands();
    }
    this.getCommandTypes();
    this.getArchitecture();
  }

  /**
   * If settings.json is changed, update c_cpp_properties.json and launch.json.
   */
  public changeCallback() {
    this.updateSettings();
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
