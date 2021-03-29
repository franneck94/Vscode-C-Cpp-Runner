import * as path from "path";
import * as vscode from "vscode";

import { getPlattformCategory, commandExists, Compilers, OperatingSystems, Architectures, getArchitecture, pathExists } from "./utils";

const EXTENSION_NAME = "C_Cpp_Runner";

export class SettingsProvider {
  // Global settings
  public config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  public plattformCategory = getPlattformCategory();
  public architecure: Architectures | undefined = undefined;
  public cCompiler: Compilers | undefined = undefined;
  public cppCompiler: Compilers | undefined = undefined;
  // Settings
  public enableWarnings: boolean = true;
  public warnings: string = "";
  public warningsAsError: boolean = true;
  public compilerPathC: string = "";
  public compilerPathCpp: string = "";
  public makePath: string = "";
  public standardC: string = "";
  public standardCpp: string = "";

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
    if (OperatingSystems.mac === this.plattformCategory) {
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
    } else if (
      OperatingSystems.linux === this.plattformCategory ||
      OperatingSystems.windows === this.plattformCategory
    ) {
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
    } else {
      this.cCompiler = undefined;
      this.cppCompiler = undefined;
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
    this.makePath = this.config.get("makePath", "make");
    this.standardC = this.config.get("standardC", "c90");
    this.standardCpp = this.config.get("standardCpp", "c++11");

    const cBasename = path.basename(this.compilerPathC, "exe");
    const cppBasename = path.basename(this.compilerPathCpp, "exe");

    if (Compilers.gcc === cBasename) {
      this.cCompiler = Compilers.gcc;
    } else {
      this.cCompiler = Compilers.clang;
    }

    if (Compilers.gpp === cppBasename) {
      this.cppCompiler = Compilers.gpp;
    } else {
      this.cppCompiler = Compilers.clangpp;
    }

    this.architecure = getArchitecture(this.cCompiler);
  }

  private setGcc(pathGcc: string) {
    this.config.update(
      "compilerPathC",
      pathGcc,
      vscode.ConfigurationTarget.Global
    );
    this.cCompiler = Compilers.gcc;
  }

  private setClang(pathClang: string) {
    this.config.update(
      "compilerPathC",
      pathClang,
      vscode.ConfigurationTarget.Global
    );
    this.cCompiler = Compilers.clang;
  }

  private setGpp(pathGpp: string) {
    this.config.update(
      "compilerPathCpp",
      pathGpp,
      vscode.ConfigurationTarget.Global
    );
    this.cppCompiler = Compilers.gpp;
  }

  private setClangpp(pathClangpp: string) {
    this.config.update(
      "compilerPathCpp",
      pathClangpp,
      vscode.ConfigurationTarget.Global
    );
    this.cppCompiler = Compilers.clangpp;
  }
}
