import * as path from 'path';
import * as vscode from 'vscode';

import {
  Architectures,
  Compilers,
  Debuggers,
  OperatingSystems,
} from '../types';
import {
  commandExists,
  getArchitecture,
  getOperatingSystem,
  pathExists,
} from '../utils';

const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;

export class SettingsProvider {
  // Global settings
  private _config = vscode.workspace.getConfiguration('C_Cpp_Runner');
  public operatingSystem = getOperatingSystem();
  public architecure: Architectures | undefined;
  public cCompiler: Compilers | undefined;
  public cppCompiler: Compilers | undefined;
  public debugger: Debuggers | undefined;
  // Settings
  public enableWarnings: boolean = true;
  public warnings: string = '';
  public warningsAsError: boolean = true;
  public compilerPathC: string = '';
  public compilerPathCpp: string = '';
  public debuggerPath: string = '';
  public makePath: string = '';
  public standardC: string = '';
  public standardCpp: string = '';
  public compilerArgs: string = '';
  public linkerArgs: string = '';
  public includePaths: String = '';

  constructor(Global: string) {
    const vscodeDirectory = path.join(Global, '.vscode');
    const propertiesPath = path.join(vscodeDirectory, 'c_cpp_properties.json');

    if (!pathExists(propertiesPath)) {
      this.checkCompilers();
    }
    this.getSettings();
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  public async checkCompilers() {
    const { found: foundGcc, path: pathGcc } = await commandExists('gcc');
    const { found: foundGpp, path: pathGpp } = await commandExists('g++');
    const { found: foundClang, path: pathClang } = await commandExists('clang');
    const { found: foundClangpp, path: pathClangpp } = await commandExists(
      'clang++',
    );
    const { found: foundGDB, path: pathGDB } = await commandExists('gdb');
    const { found: foundLLDB, path: pathLLDB } = await commandExists('lldb');
    const { found: foundMake, path: pathMake } = await commandExists('make');

    if (OperatingSystems.mac === this.operatingSystem) {
      if (foundClang && pathClang) {
        this.setClang(pathClang);
      } else if (foundGcc && pathGcc) {
        this.setGcc(pathGcc);
      } else {
        this.cCompiler = undefined;
      }

      if (foundClangpp && pathClangpp) {
        this.setClangpp(pathClangpp);
      } else if (foundGpp && pathGpp) {
        this.setGpp(pathGpp);
      } else {
        this.cppCompiler = undefined;
      }

      if (foundLLDB && pathLLDB) {
        this.setLLDB(pathLLDB);
      } else if (foundGDB && pathGDB) {
        this.setGDB(pathGDB);
      } else {
        this.debugger = undefined;
      }
    } else {
      if (foundGcc && pathGcc) {
        this.setGcc(pathGcc);
      } else if (foundClang && pathClang) {
        this.setClang(pathClang);
      } else {
        this.cCompiler = undefined;
      }

      if (foundGpp && pathGpp) {
        this.setGpp(pathGpp);
      } else if (foundClangpp && pathClangpp) {
        this.setClangpp(pathClangpp);
      } else {
        this.cppCompiler = undefined;
      }

      if (foundGDB && pathGDB) {
        this.setGDB(pathGDB);
      } else if (foundLLDB && pathLLDB) {
        this.setLLDB(pathLLDB);
      } else {
        this.debugger = undefined;
      }

      if (foundMake && pathMake) {
        this.setMake(pathMake);
      } else {
        if (this.operatingSystem === OperatingSystems.windows) {
          const {
            found: foundMakeMingw,
            path: pathMakeMingw,
          } = await commandExists('mingw32-make');
          if (foundMakeMingw && pathMakeMingw) {
            this.setMake(pathMakeMingw);
          }
        }
      }
    }

    if (this.cCompiler) {
      this.architecure = getArchitecture(this.cCompiler);
    }
  }

  /**
   * Read in the current settings.
   */
  public getSettings() {
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

    if (cBasename.includes(Compilers.clang)) {
      this.cCompiler = Compilers.clang;
      this.debugger = Debuggers.lldb;
    } else {
      this.cCompiler = Compilers.gcc;
      this.debugger = Debuggers.gdb;
    }

    if (cppBasename.includes(Compilers.clangpp)) {
      this.cppCompiler = Compilers.clangpp;
      this.debugger = Debuggers.lldb;
    } else {
      this.cppCompiler = Compilers.gpp;
      this.debugger = Debuggers.gdb;
    }

    this.architecure = getArchitecture(this.cCompiler);
  }

  private setGcc(pathGcc: string) {
    this._config.update('compilerPathC', pathGcc, CONFIGURATION_TARGET);
    this.cCompiler = Compilers.gcc;
  }

  private setClang(pathClang: string) {
    this._config.update('compilerPathC', pathClang, CONFIGURATION_TARGET);
    this.cCompiler = Compilers.clang;
  }

  private setGpp(pathGpp: string) {
    this._config.update('compilerPathCpp', pathGpp, CONFIGURATION_TARGET);
    this.cppCompiler = Compilers.gpp;
  }

  private setClangpp(pathClangpp: string) {
    this._config.update('compilerPathCpp', pathClangpp, CONFIGURATION_TARGET);
    this.cppCompiler = Compilers.clangpp;
  }

  private setLLDB(pathLLDB: string) {
    this._config.update('debuggerPath', pathLLDB, CONFIGURATION_TARGET);
    this.debugger = Debuggers.lldb;
  }

  private setGDB(pathGDB: string) {
    this._config.update('debuggerPath', pathGDB, CONFIGURATION_TARGET);
    this.debugger = Debuggers.gdb;
  }

  private setMake(pathMake: string) {
    this._config.update('makePath', pathMake, CONFIGURATION_TARGET);
  }
}
