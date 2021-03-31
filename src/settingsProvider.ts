import * as path from "path";
import * as vscode from "vscode";

import {
  getOperatingSystem,
  commandExists,
  Compilers,
  OperatingSystems,
  Architectures,
  getArchitecture,
  pathExists,
  Debuggers,
} from "./utils";

const EXTENSION_NAME = "C_Cpp_Runner";

export class SettingsProvider {
  // WorkspaceFolder settings
  public config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  public operatingSystem = getOperatingSystem();
  public architecure: Architectures | undefined = undefined;
  public cCompiler: Compilers | undefined = undefined;
  public cppCompiler: Compilers | undefined = undefined;
  public debugger: Debuggers | undefined = undefined;
  // Settings
  public enableWarnings: boolean = true;
  public warnings: string = "";
  public warningsAsError: boolean = true;
  public compilerPathC: string = "";
  public compilerPathCpp: string = "";
  public debuggerPath: string = "";
  public makePath: string = "";
  public standardC: string = "";
  public standardCpp: string = "";
  public compilerArgs: string = "";
  public linkerArgs: string = "";
  public includePaths: String = "";

  constructor(workspacePath: string) {
    const vscodeDirectory = path.join(workspacePath, ".vscode");
    const propertiesPath = path.join(vscodeDirectory, "c_cpp_properties.json");

    if (!pathExists(propertiesPath)) {
      this.checkCompilers();
    }
    this.getSettings();
  }

  /**
   * Check if gcc/g++ or clang/clang++ is in PATH and where it is located.
   */
  public async checkCompilers() {
    let { found: foundGcc, path: pathGcc } = await commandExists("gcc");
    let { found: foundGpp, path: pathGpp } = await commandExists("g++");
    let { found: foundClang, path: pathClang } = await commandExists("clang");
    let { found: foundClangpp, path: pathClangpp } = await commandExists(
      "clang++"
    );
    let { found: foundGDB, path: pathGDB } = await commandExists("gdb");
    let { found: foundLLDB, path: pathLLDB } = await commandExists("lldb");

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
    this.enableWarnings = this.config.get("enableWarnings", true);
    this.warnings = this.config.get("warnings", "-Wall -Wextra -Wpedantic");
    this.warningsAsError = this.config.get("warningsAsError", false);
    this.compilerPathC = this.config.get("compilerPathC", "gcc");
    this.compilerPathCpp = this.config.get("compilerPathCpp", "g++");
    this.debuggerPath = this.config.get("debuggerPath", "gdb");
    this.makePath = this.config.get("makePath", "make");
    this.standardC = this.config.get("standardC", "c90");
    this.standardCpp = this.config.get("standardCpp", "c++11");
    this.compilerArgs = this.config.get("compilerArgs", "");
    this.linkerArgs = this.config.get("linkerArgs", "");
    this.includePaths = this.config.get("includePaths", "");

    const cBasename = path.basename(this.compilerPathC, "exe");
    const cppBasename = path.basename(this.compilerPathCpp, "exe");

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
    this.config.update(
      "compilerPathC",
      pathGcc,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.cCompiler = Compilers.gcc;
  }

  private setClang(pathClang: string) {
    this.config.update(
      "compilerPathC",
      pathClang,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.cCompiler = Compilers.clang;
  }

  private setGpp(pathGpp: string) {
    this.config.update(
      "compilerPathCpp",
      pathGpp,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.cppCompiler = Compilers.gpp;
  }

  private setClangpp(pathClangpp: string) {
    this.config.update(
      "compilerPathCpp",
      pathClangpp,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.cppCompiler = Compilers.clangpp;
  }

  private setLLDB(pathLLDB: string) {
    this.config.update(
      "debuggerPath",
      pathLLDB,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.debugger = Debuggers.lldb;
  }

  private setGDB(pathGDB: string) {
    this.config.update(
      "debuggerPath",
      pathGDB,
      vscode.ConfigurationTarget.WorkspaceFolder
    );
    this.debugger = Debuggers.gdb;
  }
}
