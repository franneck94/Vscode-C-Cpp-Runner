import * as path from 'path';
import * as vscode from 'vscode';

import {
  commandCheck,
  getBasename,
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
import { FileProvider } from './fileProvider';

const TEMPLATE_FILENAME = 'settings_template.json';
const OUTPUT_FILENAME = 'settings.json';
const EXTENSION_NAME = 'C_Cpp_Runner';

export class SettingsProvider extends FileProvider {
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
  public operatingSystem = getOperatingSystem();
  public architecure: Architectures | undefined;
  public isCygwin: boolean = false;
  public cCompiler: Compilers | undefined;
  public cppCompiler: Compilers | undefined;
  public debugger: Debuggers | undefined;
  private _cCompilerFound: boolean = false;
  private _cppCompilerFound: boolean = false;
  private _makeFound: boolean = false;
  private _debuggerFound: boolean = false;
  private _commands: Commands | undefined;
  private _updatedCommands: boolean = false;
  // Settings
  public cCompilerPath: string = SettingsProvider.DEFAULT_C_COMPILER_PATH;
  public cppCompilerPath: string = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
  public debuggerPath: string = SettingsProvider.DEFAULT_DEBUGGER_PATH;
  public makePath: string = SettingsProvider.DEFAULT_MAKE_PATH;
  public cStandard: string = SettingsProvider.DEFAULT_C_STANDARD;
  public cppStandard: string = SettingsProvider.DEFAULT_CPP_STANDARD;
  public compilerArgs: string = SettingsProvider.DEFAULT_COMPILER_ARGS;
  public linkerArgs: string = SettingsProvider.DEFAULT_LINKER_ARGS;
  public includePaths: string = SettingsProvider.DEFAULT_INCLUDE_PATHS;
  public enableWarnings: boolean = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
  public warningsAsError: boolean = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
  public warnings: string = SettingsProvider.DEFAULT_WARNINGS;

  constructor(public workspaceFolder: string) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    if (this.updateCheck()) {
      this.createFileData();
    }
  }

  protected updateCheck() {
    let doUpdate = false;

    if (!pathExists(this._outputPath)) {
      doUpdate = true;
    } else if (false === this.commandsStored()) {
      doUpdate = true;
    }

    return doUpdate;
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
        this._makeFound &&
        this._debuggerFound
      ) {
        return true;
      }
    }

    return false;
  }

  /********************/
  /*  MAIN FUNCTIONS  */
  /********************/

  public writeFileData() {
    this.readLocalConfig();
    this.getSettings();
    if (!this.commandsStored()) {
      this.getCommands();
      this.setCommands();
      this.getCommandTypes();
      this.getArchitecture();
    }
  }

  public deleteCallback() {
    this.getCommands();
    this.setCommands();
    this.getCommandTypes();
    this.getArchitecture();
  }

  public changeCallback() {
    this.writeFileData();
  }

  private getSettings() {
    /* Mandatory in settings.json */
    this.cCompilerPath = this.getSettingsValue(
      'cCompilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );
    this.cppCompilerPath = this.getSettingsValue(
      'cppCompilerPath',
      SettingsProvider.DEFAULT_CPP_COMPILER_PATH,
    );
    this.debuggerPath = this.getSettingsValue(
      'debuggerPath',
      SettingsProvider.DEFAULT_DEBUGGER_PATH,
    );
    this.makePath = this.getSettingsValue(
      'makePath',
      SettingsProvider.DEFAULT_MAKE_PATH,
    );

    /* Optional in settings.json */
    this.enableWarnings = this.getSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warnings = this.getSettingsValue(
      'warnings',
      SettingsProvider.DEFAULT_WARNINGS,
    );
    this.warningsAsError = this.getSettingsValue(
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );
    this.cStandard = this.getSettingsValue(
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD,
    );
    this.cppStandard = this.getSettingsValue(
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );
    this.compilerArgs = this.getSettingsValue(
      'compilerArgs',
      SettingsProvider.DEFAULT_COMPILER_ARGS,
    );
    this.linkerArgs = this.getSettingsValue(
      'linkerArgs',
      SettingsProvider.DEFAULT_LINKER_ARGS,
    );
    this.includePaths = this.getSettingsValue(
      'includePaths',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );
  }

  public async getCommands() {
    this._updatedCommands = false;

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
    if (!foundMake && this.operatingSystem === OperatingSystems.windows) {
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
      this.cCompiler = undefined;
    }

    if (this._commands.foundGpp && this._commands.pathGpp) {
      this.setGpp(this._commands.pathGpp);
    } else if (this._commands.foundClangpp && this._commands.pathClangpp) {
      this.setClangpp(this._commands.pathClangpp);
    } else {
      this.cppCompiler = undefined;
    }

    if (this._commands.foundGDB && this._commands.pathGDB) {
      this.setGDB(this._commands.pathGDB);
    } else if (this._commands.foundLLDB && this._commands.pathLLDB) {
      this.setLLDB(this._commands.pathLLDB);
    } else {
      this.debugger = undefined;
    }

    if (this._commands.foundMake && this._commands.pathMake) {
      this.setMake(this._commands.pathMake);
    } else if (this._commands.foundMake && this._commands.pathMake) {
      this.setMake(this._commands.pathMake);
    } else {
      this._makeFound = false;
    }

    this._updatedCommands = true;
  }

  private getCommandTypes() {
    if (!this._updatedCommands) return;

    let cBasename: string = this.cCompilerPath;
    let cppBasename: string = this.cppCompilerPath;

    cBasename = getBasename(cBasename);
    cBasename = removeExtension(cBasename, 'exe');

    cppBasename = getBasename(cppBasename);
    cppBasename = removeExtension(cBasename, 'exe');

    if (cBasename) {
      if (cBasename.includes(Compilers.clang)) {
        this.cCompiler = Compilers.clang;
        this.debugger = Debuggers.lldb;
      } else {
        this.cCompiler = Compilers.gcc;
        this.debugger = Debuggers.gdb;
      }
    }

    if (cppBasename) {
      if (cppBasename.includes(Compilers.clangpp)) {
        this.cppCompiler = Compilers.clangpp;
        this.debugger = Debuggers.lldb;
      } else {
        this.cppCompiler = Compilers.gpp;
        this.debugger = Debuggers.gdb;
      }
    }
  }

  private getArchitecture() {
    if (!this._updatedCommands) return;

    if (this.cCompiler) {
      const ret = getArchitectureCommand(this.cCompiler);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    } else if (this.cppCompiler) {
      const ret = getArchitectureCommand(this.cppCompiler);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    }
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
    this.readLocalConfig();
  }

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

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

  public setGcc(pathGcc: string) {
    this.update('cCompilerPath', pathGcc);
    this.cCompiler = Compilers.gcc;
    this._cCompilerFound = true;
  }

  public setClang(pathClang: string) {
    this.update('cCompilerPath', pathClang);
    this.cCompiler = Compilers.clang;
    this._cCompilerFound = true;
  }

  public setGpp(pathGpp: string) {
    this.update('cppCompilerPath', pathGpp);
    this.cppCompiler = Compilers.gpp;
    this._cppCompilerFound = true;
  }

  public setClangpp(pathClangpp: string) {
    this.update('cppCompilerPath', pathClangpp);
    this.cppCompiler = Compilers.clangpp;
    this._cppCompilerFound = true;
  }

  public setLLDB(pathLLDB: string) {
    this.update('debuggerPath', pathLLDB);
    this.debugger = Debuggers.lldb;
    this._debuggerFound = true;
  }

  public setGDB(pathGDB: string) {
    this.update('debuggerPath', pathGDB);
    this.debugger = Debuggers.gdb;
    this._debuggerFound = true;
  }

  public setMake(pathMake: string) {
    this.update('makePath', pathMake);
    this._makeFound = true;
  }
}
