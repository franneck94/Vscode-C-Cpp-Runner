import * as path from 'path';
import * as vscode from 'vscode';

import {
  Architectures,
  commandExists,
  Compilers,
  Debuggers,
  getArchitecture,
  getOperatingSystem,
  OperatingSystems,
  pathExists,
} from '../utils';

const EXTENSION_NAME = 'C_Cpp_Runner';
const CONFIGURATION_TARGET = vscode.ConfigurationTarget.Workspace;

export class SettingsProvider {
  // Global settings
  public config = vscode.workspace.getConfiguration(EXTENSION_NAME);
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
      }
    }

    if (undefined !== this.cCompiler) {
      this.architecure = getArchitecture(this.cCompiler);
    }
  }

  /**
   * Read in the current settings.
   */
  public getSettings() {
    this.config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    this.enableWarnings = this.config.get('enableWarnings', true);
    this.warnings = this.config.get('warnings', '-Wall -Wextra -Wpedantic');
    this.warningsAsError = this.config.get('warningsAsError', false);
    this.compilerPathC = this.config.get('compilerPathC', 'gcc');
    this.compilerPathCpp = this.config.get('compilerPathCpp', 'g++');
    this.debuggerPath = this.config.get('debuggerPath', 'gdb');
    this.makePath = this.config.get('makePath', 'make');
    this.standardC = this.config.get('standardC', 'c90');
    this.standardCpp = this.config.get('standardCpp', 'c++11');
    this.compilerArgs = this.config.get('compilerArgs', '');
    this.linkerArgs = this.config.get('linkerArgs', '');
    this.includePaths = this.config.get('includePaths', '');

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
    this.config.update('compilerPathC', pathGcc, CONFIGURATION_TARGET);
    this.cCompiler = Compilers.gcc;
  }

  private setClang(pathClang: string) {
    this.config.update('compilerPathC', pathClang, CONFIGURATION_TARGET);
    this.cCompiler = Compilers.clang;
  }

  private setGpp(pathGpp: string) {
    this.config.update('compilerPathCpp', pathGpp, CONFIGURATION_TARGET);
    this.cppCompiler = Compilers.gpp;
  }

  private setClangpp(pathClangpp: string) {
    this.config.update('compilerPathCpp', pathClangpp, CONFIGURATION_TARGET);
    this.cppCompiler = Compilers.clangpp;
  }

  private setLLDB(pathLLDB: string) {
    this.config.update('debuggerPath', pathLLDB, CONFIGURATION_TARGET);
    this.debugger = Debuggers.lldb;
  }

  private setGDB(pathGDB: string) {
    this.config.update('debuggerPath', pathGDB, CONFIGURATION_TARGET);
    this.debugger = Debuggers.gdb;
  }

  private setMake(pathMake: string) {
    this.config.update('makePath', pathMake, CONFIGURATION_TARGET);
  }
}
