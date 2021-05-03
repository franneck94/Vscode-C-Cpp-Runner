import * as path from 'path';
import * as vscode from 'vscode';

import {
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
  OperatingSystems,
} from '../utils/types';

const OUTPUT_FILENAME = 'settings.json';
const EXTENSION_NAME = 'C_Cpp_Runner';

export class SettingsProvider {
  // Workspace data
  private _fileWatcherOnDelete: vscode.FileSystemWatcher | undefined;
  private _fileWatcherOnChange: vscode.FileSystemWatcher | undefined;
  private _outputPath: string;
  private _vscodeDirectory: string;
  private _configLocal: JsonSettings | undefined;
  private _configGlobal = vscode.workspace.getConfiguration(EXTENSION_NAME);
  // Machine information
  private _operatingSystem = getOperatingSystem();
  private _architecure: Architectures | undefined;
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
  private _cStandard: string = 'c99';
  private _cppStandard: string = 'c++11';
  private _compilerArgs: string = '';
  private _linkerArgs: string = '';
  private _includePaths: String = '';
  private _enableWarnings: boolean = false;
  private _warningsAsError: boolean = false;
  private _warnings: string = '-Wall -Wextra -Wpedantic';

  constructor(public workspaceFolder: string) {
    this._vscodeDirectory = path.join(this.workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, OUTPUT_FILENAME);

    this.readLocalConfig();
    this.createFileWatcher();
    this.checkCompilers();
    this.getSettings();
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  public async checkCompilers() {
    if (pathExists(this._outputPath)) {
      const settingsJson: JsonSettings | undefined = readJsonFile(
        this._outputPath,
      );

      if (!settingsJson) return;

      let skipCheckEntries = false;
      let skipCheckFound = false;

      if (
        settingsJson[`${EXTENSION_NAME}.cCompilerPath`] &&
        settingsJson[`${EXTENSION_NAME}.cppCompilerPath`] &&
        settingsJson[`${EXTENSION_NAME}.debuggerPath`] &&
        settingsJson[`${EXTENSION_NAME}.makePath`]
      ) {
        skipCheckEntries = true;
      }

      if (
        this._cCompilerFound &&
        this._cppCompilerFound &&
        this._foundMake &&
        this._foundDebugger
      ) {
        skipCheckFound = true;
      }

      if (skipCheckEntries || (skipCheckEntries && skipCheckFound)) {
        return;
      }
    }

    if (!pathExists(this._vscodeDirectory)) {
      mkdirRecursive(this._vscodeDirectory);
    }

    const { f: foundGcc, p: pathGcc } = await commandExists('gcc');
    const { f: foundClang, p: pathClang } = await commandExists('clang');
    const { f: foundGpp, p: pathGpp } = await commandExists('g++');
    const { f: foundClangpp, p: pathClangpp } = await commandExists('clang++');
    const { f: foundGDB, p: pathGDB } = await commandExists('gdb');
    const { f: foundLLDB, p: pathLLDB } = await commandExists('lldb');
    const { f: foundMake, p: pathMake } = await commandExists('make');

    if (this._operatingSystem === OperatingSystems.mac) {
      if (foundClang && pathClang) {
        this.setClang(pathClang);
      } else if (foundGcc && pathGcc) {
        this.setGcc(pathGcc);
      } else {
        this._cCompiler = undefined;
      }

      if (foundClangpp && pathClangpp) {
        this.setClangpp(pathClangpp);
      } else if (foundGpp && pathGpp) {
        this.setGpp(pathGpp);
      } else {
        this._cppCompiler = undefined;
      }

      if (foundLLDB && pathLLDB) {
        this.setLLDB(pathLLDB);
      } else if (foundGDB && pathGDB) {
        this.setGDB(pathGDB);
      } else {
        this._debugger = undefined;
      }
    } else {
      if (foundGcc && pathGcc) {
        this.setGcc(pathGcc);
      } else if (foundClang && pathClang) {
        this.setClang(pathClang);
      } else {
        this._cCompiler = undefined;
      }

      if (foundGpp && pathGpp) {
        this.setGpp(pathGpp);
      } else if (foundClangpp && pathClangpp) {
        this.setClangpp(pathClangpp);
      } else {
        this._cppCompiler = undefined;
      }

      if (foundGDB && pathGDB) {
        this.setGDB(pathGDB);
      } else if (foundLLDB && pathLLDB) {
        this.setLLDB(pathLLDB);
      } else {
        this._debugger = undefined;
      }

      if (foundMake && pathMake) {
        this.setMake(pathMake);
      } else {
        if (this._operatingSystem === OperatingSystems.windows) {
          const { f: foundMake, p: pathMake } = await commandExists(
            'mingw32-make',
          );
          if (foundMake && pathMake) {
            this.setMake(pathMake);
          }
        }
      }
    }

    if (this._cCompiler) {
      this._architecure = getArchitecture(this._cCompiler);
    }
  }

  /**
   * Read in the current settings.
   */
  public getSettings() {
    this.readLocalConfig();

    this._enableWarnings = this.checkSetting('enableWarnings', false);
    this._warnings = this.checkSetting('warnings', '');
    this._warningsAsError = this.checkSetting('warningsAsError', false);
    this._cCompilerPath = this.checkSetting('cCompilerPath', '');
    this._cppCompilerPath = this.checkSetting('cppCompilerPath', '');
    this._debuggerPath = this.checkSetting('debuggerPath', '');
    this._makePath = this.checkSetting('makePath', '');
    this._cStandard = this.checkSetting('cStandard', '');
    this._cppStandard = this.checkSetting('cppStandard', '');
    this._compilerArgs = this.checkSetting('compilerArgs', '');
    this._linkerArgs = this.checkSetting('linkerArgs', '');
    this._includePaths = this.checkSetting('includePaths', '');

    this.setConfiguration();
  }

  private checkSetting(name: string, defaultValue: any) {
    const settingName = `${EXTENSION_NAME}.${name}`;

    if (this._configLocal && this._configLocal[settingName]) {
      return this._configLocal[settingName];
    }

    if (this._configGlobal.has(name)) {
      return this._configGlobal.get(name, defaultValue);
    }

    return defaultValue;
  }

  private setConfiguration() {
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

    this._architecure = getArchitecture(this._cCompiler);
  }

  private createFileWatcher() {
    const deletePattern = new vscode.RelativePattern(
      this.workspaceFolder,
      '.vscode/**',
    );
    this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false,
    );

    const changePattern = new vscode.RelativePattern(
      this.workspaceFolder,
      '.vscode/settings.json',
    );
    this._fileWatcherOnChange = vscode.workspace.createFileSystemWatcher(
      changePattern,
      true,
      false,
      true,
    );

    this._fileWatcherOnDelete.onDidDelete((e: vscode.Uri) => {
      const pathName = e.fsPath;
      if (
        pathName === this._vscodeDirectory ||
        path.basename(pathName) === OUTPUT_FILENAME
      ) {
        this.checkCompilers();
      }
    });

    this._fileWatcherOnChange.onDidChange(() => {
      this.getSettings();
    });
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

  private update(key: string, value: any) {
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
}
