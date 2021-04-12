import * as path from 'path';
import * as vscode from 'vscode';

import {
  Architectures,
  Compilers,
  Debuggers,
  JsonSettings,
  OperatingSystems,
} from '../utils/types';
import {
  pathExists,
  readJsonFile,
  replaceBackslashes,
} from '../utils/fileUtils';
import {
  commandExists,
  getArchitecture,
  getOperatingSystem,
} from '../utils/systemUtils';

const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;

export class SettingsProvider {
  // Workspace data
  private readonly _fileWatcherOnDelete: vscode.FileSystemWatcher;
  private readonly _fileWatcherOnChange: vscode.FileSystemWatcher;
  private readonly _outputPath: string;
  private readonly _vscodeDirectory: string;
  private readonly _outputFileName: string;
  private _config = vscode.workspace.getConfiguration('C_Cpp_Runner');
  // Machine information
  private _operatingSystem = getOperatingSystem();
  private _architecure: Architectures | undefined;
  private _cCompiler: Compilers | undefined;
  private _cppCompiler: Compilers | undefined;
  private _debugger: Debuggers | undefined;
  private _foundCCompiler: boolean = false;
  private _foundCppCompiler: boolean = false;
  private _foundMake: boolean = false;
  private _foundDebugger: boolean = false;
  // Settings
  private _enableWarnings: boolean = true;
  private _warnings: string = '';
  private _warningsAsError: boolean = true;
  private _compilerPathC: string = '';
  private _compilerPathCpp: string = '';
  private _debuggerPath: string = '';
  private _makePath: string = '';
  private _standardC: string = '';
  private _standardCpp: string = '';
  private _compilerArgs: string = '';
  private _linkerArgs: string = '';
  private _includePaths: String = '';

  constructor(workspaceFolder: string) {
    this._outputFileName = 'settings.json';
    this._vscodeDirectory = path.join(workspaceFolder, '.vscode');
    this._outputPath = path.join(this._vscodeDirectory, this._outputFileName);

    const deletePattern = `${replaceBackslashes(this._vscodeDirectory)}/**`;
    this._fileWatcherOnDelete = vscode.workspace.createFileSystemWatcher(
      deletePattern,
      true,
      true,
      false,
    );

    const changePattern = replaceBackslashes(this._outputPath);
    this._fileWatcherOnChange = vscode.workspace.createFileSystemWatcher(
      changePattern,
      true,
      false,
      false,
    );

    this.checkCompilers();
    this.getSettings();

    this._fileWatcherOnDelete.onDidDelete(() => {
      this.checkCompilers();
    });

    this._fileWatcherOnChange.onDidChange(() => {
      this.getSettings();
    });
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  // @ts-ignore
  public async checkCompilers() {
    if (pathExists(this._outputPath)) {
      const settingsJson: JsonSettings = readJsonFile(this._outputPath);
      let skipCheckEntries = false;
      let skipCheckFound = false;

      if (
        settingsJson['C_Cpp_Runner.compilerPathC'] &&
        settingsJson['C_Cpp_Runner.compilerPathCpp'] &&
        settingsJson['C_Cpp_Runner.debuggerPath'] &&
        settingsJson['C_Cpp_Runner.makePath']
      ) {
        skipCheckEntries = true;
      }

      if (
        this._foundCCompiler &&
        this._foundCppCompiler &&
        this._foundMake &&
        this._foundDebugger
      ) {
        skipCheckFound = true;
      }

      if (skipCheckEntries || (skipCheckEntries && skipCheckFound)) {
        return;
      }
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

  private setGcc(pathGcc: string) {
    this._config.update('compilerPathC', pathGcc, CONFIGURATION_TARGET);
    this._cCompiler = Compilers.gcc;
    this._foundCCompiler = true;
  }

  private setClang(pathClang: string) {
    this._config.update('compilerPathC', pathClang, CONFIGURATION_TARGET);
    this._cCompiler = Compilers.clang;
    this._foundCCompiler = true;
  }

  private setGpp(pathGpp: string) {
    this._config.update('compilerPathCpp', pathGpp, CONFIGURATION_TARGET);
    this._cppCompiler = Compilers.gpp;
    this._foundCppCompiler = true;
  }

  private setClangpp(pathClangpp: string) {
    this._config.update('compilerPathCpp', pathClangpp, CONFIGURATION_TARGET);
    this._cppCompiler = Compilers.clangpp;
    this._foundCppCompiler = true;
  }

  private setLLDB(pathLLDB: string) {
    this._config.update('debuggerPath', pathLLDB, CONFIGURATION_TARGET);
    this._debugger = Debuggers.lldb;
    this._foundDebugger = true;
  }

  private setGDB(pathGDB: string) {
    this._config.update('debuggerPath', pathGDB, CONFIGURATION_TARGET);
    this._debugger = Debuggers.gdb;
    this._foundDebugger = true;
  }

  private setMake(pathMake: string) {
    this._config.update('makePath', pathMake, CONFIGURATION_TARGET);
    this._foundMake = true;
  }

  public get operatingSystem() {
    return this._operatingSystem;
  }
  public get architecure(): Architectures | undefined {
    return this._architecure;
  }
  public get cCompiler(): Compilers | undefined {
    return this._cCompiler;
  }
  public get cppCompiler(): Compilers | undefined {
    return this._cppCompiler;
  }
  public get debugger(): Debuggers | undefined {
    return this._debugger;
  }
  public get enableWarnings(): boolean {
    return this._enableWarnings;
  }
  public get warnings(): string {
    return this._warnings;
  }
  public get warningsAsError(): boolean {
    return this._warningsAsError;
  }
  public get compilerPathC(): string {
    return this._compilerPathC;
  }
  public get compilerPathCpp(): string {
    return this._compilerPathCpp;
  }
  public get debuggerPath(): string {
    return this._debuggerPath;
  }
  public get makePath(): string {
    return this._makePath;
  }
  public get standardC(): string {
    return this._standardC;
  }
  public get standardCpp(): string {
    return this._standardCpp;
  }
  public get compilerArgs(): string {
    return this._compilerArgs;
  }
  public get linkerArgs(): string {
    return this._linkerArgs;
  }
  public get includePaths(): String {
    return this._includePaths;
  }
}
