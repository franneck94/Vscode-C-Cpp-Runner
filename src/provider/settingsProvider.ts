import * as path from 'path';
import * as vscode from 'vscode';

import {
	commandCheck,
	getBasename,
	pathExists,
	readJsonFile,
	removeExtension,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import {
	commandExists,
	getCompilerArchitecture,
	getOperatingSystem,
} from '../utils/systemUtils';
import {
	Architectures,
	Commands,
	Compilers,
	CompilerSystems,
	Debuggers,
	JsonSettings,
	OperatingSystems,
} from '../utils/types';
import { getActivationState } from '../utils/vscodeUtils';
import { FileProvider } from './fileProvider';

const TEMPLATE_FILENAME = 'settings_template.json';
const OUTPUT_FILENAME = 'settings.json';
const EXTENSION_NAME = 'C_Cpp_Runner';
const C_CPP_EXTENSION_NAME = 'C_Cpp';

export class SettingsProvider extends FileProvider {
  static DEFAULT_C_COMPILER_PATH = 'gcc';
  static DEFAULT_CPP_COMPILER_PATH = 'g++';
  static DEFAULT_DEBUGGER_PATH = 'gdb';
  static DEFAULT_MSVC_BATCH_PATH = '';
  static DEFAULT_MSVC_TOOLS_PATH = '';
  static DEFAULT_C_STANDARD = '';
  static DEFAULT_CPP_STANDARD = '';
  static DEFAULT_INCLUDE_SEARCH = ['*'];
  static DEFAULT_EXCLUDE_SEARCH = [];

  static DEFAULT_ENABLE_WARNINGS = true;
  static DEFAULT_WARNINGS_AS_ERRORS = false;

  static DEFAULT_WARNINGS = ['-Wall', '-Wextra', '-Wpedantic'];
  static DEFAULT_COMPILER_ARGS = [];
  static DEFAULT_LINKER_ARGS = [];
  static DEFAULT_INCLUDE_PATHS = [];

  static MSVC_COMPILER_NAME = 'cl.exe';
  static MSVC_LINKER_NAME = 'link.exe';

  // Workspace data
  private _configGlobal = vscode.workspace.getConfiguration(EXTENSION_NAME);
  private _configGlobalCCpp = vscode.workspace.getConfiguration(
    C_CPP_EXTENSION_NAME,
  );
  // Machine information
  public operatingSystem = getOperatingSystem();
  public architecure: Architectures | undefined;
  public isCygwin: boolean = false;
  public isMsvc: boolean = false;
  public cCompiler: Compilers | undefined;
  public cppCompiler: Compilers | undefined;
  public debugger: Debuggers | undefined;
  private _cCompilerFound: boolean = false;
  private _cppCompilerFound: boolean = false;
  private _debuggerFound: boolean = false;
  private _commands: Commands = new Commands();
  // Settings
  public cCompilerPath: string = SettingsProvider.DEFAULT_C_COMPILER_PATH;
  public cppCompilerPath: string = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
  public debuggerPath: string = SettingsProvider.DEFAULT_DEBUGGER_PATH;
  public msvcBatchPath: string = SettingsProvider.DEFAULT_MSVC_BATCH_PATH;
  public msvcToolsPath: string = SettingsProvider.DEFAULT_MSVC_TOOLS_PATH;
  public cStandard: string = SettingsProvider.DEFAULT_C_STANDARD;
  public cppStandard: string = SettingsProvider.DEFAULT_CPP_STANDARD;
  public compilerArgs: string[] = SettingsProvider.DEFAULT_COMPILER_ARGS;
  public linkerArgs: string[] = SettingsProvider.DEFAULT_LINKER_ARGS;
  public includePaths: string[] = SettingsProvider.DEFAULT_INCLUDE_PATHS;
  public includeSearch: string[] = SettingsProvider.DEFAULT_INCLUDE_SEARCH;
  public excludeSearch: string[] = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;
  public enableWarnings: boolean = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
  public warningsAsError: boolean = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
  public warnings: string[] = SettingsProvider.DEFAULT_WARNINGS;

  constructor(public workspaceFolder: string, public activeFolder: string) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    const settingsFileMissing = this.checkSettingsFile();
    const settingsMissing = this.updateCheck();
    const propertiesFileMissing = this.checkPropertiesFile();

    if (settingsMissing && propertiesFileMissing && activeFolder) {
      this.createFileData();
      return;
    }

    if (settingsFileMissing && !propertiesFileMissing && activeFolder) {
      this.getSettingsFromProperties(settingsFileMissing);
      this.storeCommands();
      return;
    }

    if (activeFolder) {
      this.getSettings();
      this.getCommandTypes();
      this.getArchitecture();
      return;
    }
  }

  protected updateCheck() {
    let settingsMissing = false;

    if (!pathExists(this._outputPath)) {
      settingsMissing = true;
    } else if (!this.commandsStored()) {
      settingsMissing = true;
    }

    return settingsMissing;
  }

  private checkPropertiesFile() {
    let propertiesFileMissing = false;

    const propertiesPath = path.join(
      this._vscodeDirectory,
      'c_cpp_properties.json',
    );
    if (!pathExists(propertiesPath)) {
      propertiesFileMissing = true;
    }

    return propertiesFileMissing;
  }

  private checkSettingsFile() {
    let settingsFileMissing = false;

    const settingsPath = path.join(this._vscodeDirectory, 'settings.json');
    if (!pathExists(settingsPath)) {
      settingsFileMissing = true;
    }

    return settingsFileMissing;
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
        commandCheck(`${EXTENSION_NAME}.debuggerPath`, settingsJson)
      ) {
        return true;
      }

      if (
        this._cCompilerFound &&
        this._cppCompilerFound &&
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
    this.getSettings();
    this.storeCommands();
  }

  private storeCommands() {
    if (this.commandsStored()) return;

    this.getCommands();
    this.setCommands();
    this.getCommandTypes();
    this.getArchitecture();
  }

  public deleteCallback() {
    const extensionIsActive = getActivationState();
    if (extensionIsActive) this.writeFileData();
  }

  public changeCallback() {
    this.getSettings();
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  private getSettings() {
    const settingsLocal: JsonSettings | undefined = readJsonFile(
      this._outputPath,
    );

    this.getMandatorySettings(settingsLocal);
    this.getOptionalSettings(settingsLocal);
  }

  private getMandatorySettings(settingsLocal: JsonSettings | undefined) {
    this.cCompilerPath = this.getSettingsValue(
      settingsLocal,
      'cCompilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );
    this.cppCompilerPath = this.getSettingsValue(
      settingsLocal,
      'cppCompilerPath',
      SettingsProvider.DEFAULT_CPP_COMPILER_PATH,
    );
    this.debuggerPath = this.getSettingsValue(
      settingsLocal,
      'debuggerPath',
      SettingsProvider.DEFAULT_DEBUGGER_PATH,
    );
  }

  private getOptionalSettings(settingsLocal: JsonSettings | undefined) {
    this.msvcBatchPath = this.getSettingsValue(
      settingsLocal,
      'msvcBatchPath',
      SettingsProvider.DEFAULT_MSVC_BATCH_PATH,
    );
    if (this.msvcBatchPath !== SettingsProvider.DEFAULT_MSVC_BATCH_PATH) {
      this.isMsvc = true;
      this.searchMsvcToolsPath();
    } else {
      this.isMsvc = false;
    }

    this.enableWarnings = this.getSettingsValue(
      settingsLocal,
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warnings = this.getSettingsValue(
      settingsLocal,
      'warnings',
      SettingsProvider.DEFAULT_WARNINGS,
    );
    this.warningsAsError = this.getSettingsValue(
      settingsLocal,
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );

    this.cStandard = this.getSettingsValue(
      settingsLocal,
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD,
    );
    this.cppStandard = this.getSettingsValue(
      settingsLocal,
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );

    this.compilerArgs = this.getSettingsValue(
      settingsLocal,
      'compilerArgs',
      SettingsProvider.DEFAULT_COMPILER_ARGS,
    );
    this.linkerArgs = this.getSettingsValue(
      settingsLocal,
      'linkerArgs',
      SettingsProvider.DEFAULT_LINKER_ARGS,
    );
    this.includePaths = this.getSettingsValue(
      settingsLocal,
      'includePaths',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );

    this.includeSearch = this.getSettingsValue(
      settingsLocal,
      'includeSearch',
      SettingsProvider.DEFAULT_INCLUDE_SEARCH,
    );
    this.excludeSearch = this.getSettingsValue(
      settingsLocal,
      'excludeSearch',
      SettingsProvider.DEFAULT_EXCLUDE_SEARCH,
    );

    // Additional settings
    if (this._configGlobalCCpp) {
      const globalIncludePath = this.getSettingsValue(
        this._configGlobalCCpp['default'],
        'includePath',
        '',
        false,
      );
      if (globalIncludePath && globalIncludePath !== '') {
        this.includePaths.push(...globalIncludePath);
      }
    }
  }

  private getSettingsFromProperties(settingsFileMissing: boolean) {
    const propertiesPath = path.join(
      this._vscodeDirectory,
      'c_cpp_properties.json',
    );
    const properties: JsonSettings | undefined = readJsonFile(propertiesPath)
      .configurations[0];

    if (!properties) return;

    /* Mandatory in settings.json */
    this.cCompilerPath = this.getPropertiesValue(
      properties,
      'compilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );

    const rootDirCompiler = path.dirname(this.cCompilerPath);
    const programSuffix =
      this.operatingSystem === OperatingSystems.windows ? '.exe' : '';
    const isClang = path
      .basename(this.cCompilerPath)
      .toLowerCase()
      .includes('clang');

    let cppCompilerPath: string;
    let debuggerPath: string;

    if (isClang) {
      cppCompilerPath = 'clang++' + programSuffix;
      debuggerPath = 'lldb' + programSuffix;
    } else {
      cppCompilerPath = 'g++' + programSuffix;
      debuggerPath = 'gdb' + programSuffix;
    }

    this.cppCompilerPath = path.join(rootDirCompiler, cppCompilerPath);
    this.debuggerPath = path.join(rootDirCompiler, debuggerPath);

    /* Optional in settings.json */
    const _cStandard = this.getPropertiesValue(
      properties,
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD,
    );
    const _cppStandard = this.getPropertiesValue(
      properties,
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );

    const _includePaths = this.getPropertiesValue(
      properties,
      'includePath',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );

    let _compilerArgs = this.getPropertiesValue(
      properties,
      'compilerArgs',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );
    const _warnings = _compilerArgs.filter((arg: string) => arg.includes('-W'));
    _compilerArgs = _compilerArgs.filter((arg: string) => !arg.includes('-W'));

    this.cStandard =
      _cStandard !== '${default}'
        ? _cStandard
        : SettingsProvider.DEFAULT_C_STANDARD;
    this.cppStandard =
      _cppStandard !== '${default}'
        ? _cppStandard
        : SettingsProvider.DEFAULT_CPP_STANDARD;

    this.includePaths =
      _includePaths !== ['${workspaceFolder}/**']
        ? _includePaths
        : SettingsProvider.DEFAULT_INCLUDE_PATHS;

    this.compilerArgs =
      _compilerArgs !== ''
        ? _compilerArgs
        : SettingsProvider.DEFAULT_COMPILER_ARGS;
    this.linkerArgs =
      _compilerArgs !== ''
        ? _compilerArgs
        : SettingsProvider.DEFAULT_LINKER_ARGS;

    this.warnings =
      _warnings.length > 0 ? _warnings : SettingsProvider.DEFAULT_WARNINGS;

    if (settingsFileMissing) {
      this.enableWarnings = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
      this.warningsAsError = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
      this.excludeSearch = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;
    } else {
      const settingsLocal: JsonSettings | undefined = readJsonFile(
        this._outputPath,
      );

      this.getOptionalSettings(settingsLocal);
    }
  }

  public getCommands() {
    this.searchPathVariables();
    this.searchCommands();
  }

  private async searchCommands() {
    if (!this._commands.foundGcc) {
      ({
        f: this._commands.foundGcc,
        p: this._commands.pathGcc,
      } = await commandExists(Compilers.gcc));

      if (!this._commands.foundGcc) {
        ({
          f: this._commands.foundClang,
          p: this._commands.pathClang,
        } = await commandExists(Compilers.clang));
      }
    }

    if (!this._commands.foundGpp) {
      ({
        f: this._commands.foundGpp,
        p: this._commands.pathGpp,
      } = await commandExists(Compilers.gpp));

      if (!this._commands.foundGpp) {
        ({
          f: this._commands.foundClangpp,
          p: this._commands.pathClangpp,
        } = await commandExists(Compilers.clangpp));
      }
    }

    if (!this._commands.foundGDB) {
      ({
        f: this._commands.foundGDB,
        p: this._commands.pathGDB,
      } = await commandExists(Debuggers.gdb));

      if (!this._commands.foundGDB) {
        ({
          f: this._commands.foundLLDB,
          p: this._commands.pathLLDB,
        } = await commandExists(Debuggers.lldb));
      }
    }
  }

  private searchPathVariables() {
    this._commands = new Commands();

    const env = process.env;
    if (env['PATH']) {
      let paths: string[] = [];
      if (this.operatingSystem === OperatingSystems.windows) {
        paths = env['PATH'].split(';');
      } else {
        paths = env['PATH'].split(':');
      }
      for (const envPath of paths) {
        if (
          (this._commands.foundGcc &&
            this._commands.foundGpp &&
            this._commands.foundGDB) ||
          (this._commands.foundClang &&
            this._commands.foundClangpp &&
            this._commands.foundLLDB)
        ) {
          break;
        }

        if (this.operatingSystem === OperatingSystems.windows) {
          if (this.skipCheckWindows(envPath)) continue;
        } else if (this.operatingSystem === OperatingSystems.linux) {
          if (this.skipCheckLinux(envPath)) continue;
        } else if (this.operatingSystem === OperatingSystems.mac) {
          if (this.skipCheckMac(envPath)) continue;
        }

        if (this.operatingSystem === OperatingSystems.windows) {
          this.searchPathVariablesWindows(envPath);
        } else if (this.operatingSystem === OperatingSystems.linux) {
          this.searchPathVariablesLinux(envPath);
        } else if (this.operatingSystem === OperatingSystems.mac) {
          this.searchPathVariablesMac(envPath);
        }
      }
    }
  }

  private skipCheckWindows(envPath: string) {
    if (
      !envPath.toLowerCase().includes('bin') &&
      !envPath.toLowerCase().includes('mingw') &&
      !envPath.toLowerCase().includes('msys') &&
      !envPath.toLowerCase().includes('cygwin')
    ) {
      return true;
    }

    return false;
  }

  private skipCheckLinux(envPath: string) {
    if (
      !envPath.toLowerCase().startsWith('/bin') &&
      !envPath.toLowerCase().startsWith('/usr/bin')
    ) {
      return true;
    }

    return false;
  }

  private skipCheckMac(envPath: string) {
    if (!envPath.toLowerCase().includes('bin')) {
      return true;
    }

    return false;
  }

  private searchPathVariablesWindows(envPath: string) {
    const lower_path = envPath.toLocaleLowerCase();
    if (
      lower_path.includes(CompilerSystems.cygwin) ||
      lower_path.includes(CompilerSystems.mingw) ||
      lower_path.includes(CompilerSystems.msys2)
    ) {
      this._commands.pathGcc = path.join(envPath, Compilers.gcc + '.exe');
      this._commands.pathGpp = path.join(envPath, Compilers.gpp + '.exe');
      this._commands.pathGDB = path.join(envPath, Debuggers.gdb + '.exe');

      if (pathExists(this._commands.pathGcc)) {
        this._commands.foundGcc = true;
      }
      if (pathExists(this._commands.pathGpp)) {
        this._commands.foundGpp = true;
      }
      if (pathExists(this._commands.pathGDB)) {
        this._commands.foundGDB = true;
      }
    }
  }

  private searchPathVariablesLinux(envPath: string) {
    this._commands.pathGcc = path.join(envPath, Compilers.gcc);
    this._commands.pathGpp = path.join(envPath, Compilers.gpp);
    this._commands.pathGDB = path.join(envPath, Debuggers.gdb);

    if (pathExists(this._commands.pathGcc)) {
      this._commands.foundGcc = true;
    }
    if (pathExists(this._commands.pathGpp)) {
      this._commands.foundGpp = true;
    }
    if (pathExists(this._commands.pathGDB)) {
      this._commands.foundGDB = true;
    }
  }

  private searchPathVariablesMac(envPath: string) {
    this._commands.pathClang = path.join(envPath, Compilers.clang);
    this._commands.pathClangpp = path.join(envPath, Compilers.clangpp);
    this._commands.pathLLDB = path.join(envPath, Debuggers.lldb);

    if (pathExists(this._commands.pathClang)) {
      this._commands.foundClang = true;
    }
    if (pathExists(this._commands.pathClangpp)) {
      this._commands.foundClangpp = true;
    }
    if (pathExists(this._commands.pathLLDB)) {
      this._commands.foundLLDB = true;
    }
  }

  private searchMsvcToolsPath() {
    let msvcBasePath = this.msvcBatchPath.split('VC')[0];

    if (!msvcBasePath) return;

    msvcBasePath += '/VC/Tools/MSVC';

    const versionNumber = '14.30.30705';

    let architecturePath: string;
    if (
      this.architecure === Architectures.x64 ||
      this.architecure === undefined
    ) {
      architecturePath = 'bin/Hostx64/x64';
    } else {
      architecturePath = 'bin/Hostx86/x86';
    }

    this.msvcToolsPath = path.join(
      msvcBasePath,
      versionNumber,
      architecturePath,
    );
  }

  private setCommands() {
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

    this.setOtherSettings();
  }

  private getCommandTypes() {
    let cBasename = this.cCompilerPath;
    let cppBasename = this.cppCompilerPath;

    cBasename = getBasename(cBasename);
    cBasename = removeExtension(cBasename, 'exe');

    cppBasename = getBasename(cppBasename);
    cppBasename = removeExtension(cppBasename, 'exe');

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
    if (this.cCompiler) {
      const ret = getCompilerArchitecture(this.cCompilerPath);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    } else if (this.cppCompiler) {
      const ret = getCompilerArchitecture(this.cppCompilerPath);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    } else {
      this.architecure = Architectures.x64;
      this.isCygwin = false;
    }
  }

  public reset() {
    /* Mandatory in settings.json */
    this.cCompilerPath = SettingsProvider.DEFAULT_C_COMPILER_PATH;
    this.cppCompilerPath = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
    this.debuggerPath = SettingsProvider.DEFAULT_DEBUGGER_PATH;

    /* Optional in settings.json */
    this.enableWarnings = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
    this.warnings = SettingsProvider.DEFAULT_WARNINGS;
    this.warningsAsError = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
    this.cStandard = SettingsProvider.DEFAULT_C_STANDARD;
    this.cppStandard = SettingsProvider.DEFAULT_CPP_STANDARD;
    this.compilerArgs = SettingsProvider.DEFAULT_COMPILER_ARGS;
    this.linkerArgs = SettingsProvider.DEFAULT_LINKER_ARGS;
    this.includePaths = SettingsProvider.DEFAULT_INCLUDE_PATHS;
    this.excludeSearch = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;

    /* Write default settings to file */
    this.setGcc(this.cCompilerPath);
    this.setGpp(this.cppCompilerPath);
    this.setGDB(this.debuggerPath);
    this.setOtherSettings();
  }

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

  private getSettingsValue(
    settingsLocal: JsonSettings | undefined,
    name: string,
    defaultValue: any,
    isExtensionSetting: boolean = true,
  ) {
    let settingName: string;

    if (isExtensionSetting) {
      settingName = `${EXTENSION_NAME}.${name}`;
    } else {
      settingName = `${name}`;
    }

    if (settingsLocal && settingsLocal[settingName] !== undefined) {
      return settingsLocal[settingName];
    }

    if (this._configGlobal.has(name)) {
      return this._configGlobal.get(name, defaultValue);
    }

    return defaultValue;
  }

  private getPropertiesValue(
    properties: JsonSettings | undefined,
    name: string,
    defaultValue: any,
  ) {
    if (properties && properties[name] !== undefined) {
      return properties[name];
    }

    return defaultValue;
  }

  public update(key: string, value: any) {
    let settingsJson: JsonSettings | undefined = readJsonFile(this._outputPath);

    if (!settingsJson) settingsJson = {};

    const settingName = `${EXTENSION_NAME}.${key}`;

    settingsJson[settingName] = value;

    writeJsonFile(this._outputPath, settingsJson);
  }

  private updatebasedOnEnv(settingsName: string, settingsValue: string) {
    if (this.operatingSystem === OperatingSystems.windows) {
      this.update(settingsName, replaceBackslashes(settingsValue));
    } else {
      this.update(settingsName, settingsValue);
    }
  }

  /********************/
  /*      SETTER      */
  /********************/

  public setGcc(pathGcc: string) {
    this.updatebasedOnEnv('cCompilerPath', pathGcc);
    this.cCompiler = Compilers.gcc;
    this._cCompilerFound = true;
  }

  public setClang(pathClang: string) {
    this.updatebasedOnEnv('cCompilerPath', pathClang);
    this.cCompiler = Compilers.clang;
    this._cCompilerFound = true;
  }

  public setGpp(pathGpp: string) {
    this.updatebasedOnEnv('cppCompilerPath', pathGpp);
    this.cppCompiler = Compilers.gpp;
    this._cppCompilerFound = true;
  }

  public setClangpp(pathClangpp: string) {
    this.updatebasedOnEnv('cppCompilerPath', pathClangpp);
    this.cppCompiler = Compilers.clangpp;
    this._cppCompilerFound = true;
  }

  public setLLDB(pathLLDB: string) {
    this.updatebasedOnEnv('debuggerPath', pathLLDB);
    this.debugger = Debuggers.lldb;
    this._debuggerFound = true;
  }

  public setGDB(pathGDB: string) {
    this.updatebasedOnEnv('debuggerPath', pathGDB);
    this.debugger = Debuggers.gdb;
    this._debuggerFound = true;
  }

  public setOtherSettings() {
    this.update('cStandard', this.cStandard);
    this.update('cppStandard', this.cppStandard);

    this.update('msvcBatchPath', this.msvcBatchPath);

    this.update('warnings', this.warnings);
    this.update('enableWarnings', this.enableWarnings);
    this.update('warningsAsError', this.warningsAsError);

    this.update('compilerArgs', this.compilerArgs);
    this.update('linkerArgs', this.linkerArgs);
    this.update('includePaths', this.includePaths);

    this.update('includeSearch', this.includeSearch);
    this.update('excludeSearch', this.excludeSearch);
  }
}
