import * as path from 'path';
import * as vscode from 'vscode';

import {
	foldersInDir,
	localSettingExist,
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import {
	getCompilerArchitecture,
	getOperatingSystem,
} from '../utils/systemUtils';
import {
	Architectures,
	Commands,
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
  static DEFAULT_C_STANDARD_UNIX = '';
  static DEFAULT_C_STANDARD_MSVC = 'c17';
  static DEFAULT_CPP_STANDARD = '';
  static DEFAULT_INCLUDE_SEARCH = ['*', '**/*'];
  static DEFAULT_EXCLUDE_SEARCH = [
    '**/build',
    '**/build/**',
    '**/.*',
    '**/.*/**',
    '**/.vscode',
    '**/.vscode/**',
  ];

  static DEFAULT_ENABLE_WARNINGS = true;
  static DEFAULT_WARNINGS_AS_ERRORS = false;

  static DEFAULT_WARNINGS_UNIX = ['-Wall', '-Wextra', '-Wpedantic'];
  static DEFAULT_WARNINGS_MSVC = ['/W4'];
  static DEFAULT_COMPILER_ARGS = [];
  static DEFAULT_LINKER_ARGS = [];
  static DEFAULT_INCLUDE_PATHS = [];

  static MSVC_COMPILER_NAME = 'cl.exe';

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
  private _commands: Commands = new Commands();
  // Settings
  public cCompilerPath: string = SettingsProvider.DEFAULT_C_COMPILER_PATH;
  public cppCompilerPath: string = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
  public debuggerPath: string = SettingsProvider.DEFAULT_DEBUGGER_PATH;
  public msvcBatchPath: string = SettingsProvider.DEFAULT_MSVC_BATCH_PATH;
  public msvcToolsPath: string = SettingsProvider.DEFAULT_MSVC_TOOLS_PATH;
  public cStandard: string = SettingsProvider.DEFAULT_C_STANDARD_UNIX;
  public cppStandard: string = SettingsProvider.DEFAULT_CPP_STANDARD;
  public compilerArgs: string[] = SettingsProvider.DEFAULT_COMPILER_ARGS;
  public linkerArgs: string[] = SettingsProvider.DEFAULT_LINKER_ARGS;
  public includePaths: string[] = SettingsProvider.DEFAULT_INCLUDE_PATHS;
  public includeSearch: string[] = SettingsProvider.DEFAULT_INCLUDE_SEARCH;
  public excludeSearch: string[] = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;
  public enableWarnings: boolean = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
  public warningsAsError: boolean = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
  public warnings: string[] = SettingsProvider.DEFAULT_WARNINGS_UNIX;

  constructor(public workspaceFolder: string, public activeFolder: string) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    const settingsFileMissing = this.localFileExist('settings.json');
    const settingsMissing = this.updateCheck();
    const propertiesFileMissing = this.localFileExist('c_cpp_properties.json');

    if (settingsMissing && propertiesFileMissing && activeFolder) {
      this.loadGlobalSettings();
      this.createFileData();
      return;
    }

    if (settingsFileMissing && !propertiesFileMissing && activeFolder) {
      this.getSettingsFromProperties();
      this.storeSettings();
      return;
    }

    if (activeFolder) {
      this.loadLocalSettings();
      this.getArchitecture();
      return;
    }
  }

  protected updateCheck() {
    let settingsMissing = false;

    if (!pathExists(this._outputPath)) {
      settingsMissing = true;
    } else if (!this.commandsAlreadyStored()) {
      settingsMissing = true;
    }

    return settingsMissing;
  }

  private localFileExist(name: string) {
    let settingsFileMissing = false;

    const settingsPath = path.join(this._vscodeDirectory, name);
    if (!pathExists(settingsPath)) {
      settingsFileMissing = true;
    }

    return settingsFileMissing;
  }

  private commandsAlreadyStored() {
    if (pathExists(this._outputPath)) {
      const settingsJson: JsonSettings | undefined = readJsonFile(
        this._outputPath,
      );

      if (!settingsJson) return false;

      if (
        localSettingExist(`${EXTENSION_NAME}.cCompilerPath`, settingsJson) &&
        localSettingExist(`${EXTENSION_NAME}.cppCompilerPath`, settingsJson) &&
        localSettingExist(`${EXTENSION_NAME}.debuggerPath`, settingsJson)
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
    this.loadLocalSettings();
    this.storeSettings();
  }

  public deleteCallback() {
    const extensionIsActive = getActivationState();
    if (extensionIsActive) this.writeFileData();
  }

  public changeCallback() {
    this.loadLocalSettings();
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  private loadLocalSettings() {
    const settingsLocal: JsonSettings | undefined = readJsonFile(
      this._outputPath,
    );

    // mandatory
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

    // optional
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
      SettingsProvider.DEFAULT_WARNINGS_UNIX,
    );

    const msvcWarnings = this.warnings.some((warning: string) =>
      warning.includes('/'),
    );

    if (this.isMsvc && !msvcWarnings) {
      this.warnings = SettingsProvider.DEFAULT_WARNINGS_MSVC;
    } else if (!this.isMsvc && msvcWarnings) {
      this.warnings = SettingsProvider.DEFAULT_WARNINGS_UNIX;
    }

    this.warningsAsError = this.getSettingsValue(
      settingsLocal,
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );

    this.cStandard = this.getSettingsValue(
      settingsLocal,
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD_UNIX,
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

  private getSettingsFromProperties() {
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
    const _cStandard: string = this.getPropertiesValue(
      properties,
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD_UNIX,
    );
    const _cppStandard: string = this.getPropertiesValue(
      properties,
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );

    const _includePaths: string[] = this.getPropertiesValue(
      properties,
      'includePath',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );

    this.cStandard =
      _cStandard !== '${default}'
        ? _cStandard
        : SettingsProvider.DEFAULT_C_STANDARD_UNIX;
    this.cppStandard =
      _cppStandard !== '${default}'
        ? _cppStandard
        : SettingsProvider.DEFAULT_CPP_STANDARD;

    this.includePaths =
      _includePaths.length !== 0
        ? _includePaths
        : SettingsProvider.DEFAULT_INCLUDE_PATHS;

    this.compilerArgs = SettingsProvider.DEFAULT_COMPILER_ARGS;
    this.linkerArgs = SettingsProvider.DEFAULT_LINKER_ARGS;
    this.warnings = SettingsProvider.DEFAULT_WARNINGS_UNIX;
    this.enableWarnings = SettingsProvider.DEFAULT_ENABLE_WARNINGS;
    this.warningsAsError = SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS;
    this.excludeSearch = SettingsProvider.DEFAULT_EXCLUDE_SEARCH;
  }

  private searchMsvcToolsPath() {
    let msvcBasePath = this.msvcBatchPath.split('VC')[0];

    if (!msvcBasePath) return;

    msvcBasePath += 'VC/Tools/MSVC';

    const installed_versions = foldersInDir(msvcBasePath);
    const newst_version_path =
      installed_versions[installed_versions.length - 1];
    if (installed_versions.length === 0 || !newst_version_path) return;

    const newst_version_path_splitted = newst_version_path.split('\\');
    if (newst_version_path_splitted.length === 0) return;

    const versionNumber =
      newst_version_path_splitted[newst_version_path_splitted.length - 1];

    if (!versionNumber) return;

    let architecturePath: string;
    if (
      this.architecure === Architectures.x64 ||
      this.architecure === undefined
    ) {
      architecturePath = 'bin/Hostx64/x64';
    } else {
      architecturePath = 'bin/Hostx86/x86';
    }

    if (!pathExists(architecturePath)) return;

    this.msvcToolsPath = path.join(
      msvcBasePath,
      versionNumber,
      architecturePath,
    );
  }

  private getArchitecture() {
    if (this.cCompilerPath) {
      const ret = getCompilerArchitecture(this.cCompilerPath);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    } else if (this.cppCompilerPath) {
      const ret = getCompilerArchitecture(this.cppCompilerPath);
      this.architecure = ret.architecure;
      this.isCygwin = ret.isCygwin;
    } else {
      this.architecure = Architectures.x64;
      this.isCygwin = false;
    }

    this.isMsvc = false;
  }

  public reset() {
    this.loadGlobalSettings();
    this.storeSettings();
  }

  private loadGlobalSettings() {
    /* Mandatory in settings.json */
    this.cCompilerPath = this.getDefaultSettingsValue(
      'cCompilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );
    this.cppCompilerPath = this.getDefaultSettingsValue(
      'cppCompilerPath',
      SettingsProvider.DEFAULT_CPP_COMPILER_PATH,
    );
    this.debuggerPath = this.getDefaultSettingsValue(
      'debuggerPath',
      SettingsProvider.DEFAULT_DEBUGGER_PATH,
    );
    this.msvcBatchPath = this.getDefaultSettingsValue(
      'msvcBatchPath',
      SettingsProvider.DEFAULT_MSVC_BATCH_PATH,
    );
    this.msvcToolsPath = this.getDefaultSettingsValue(
      'msvcToolsPath',
      SettingsProvider.DEFAULT_MSVC_TOOLS_PATH,
    );

    /* Optional in settings.json */
    this.enableWarnings = this.getDefaultSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warnings = this.getDefaultSettingsValue(
      'warnings',
      SettingsProvider.DEFAULT_WARNINGS_UNIX,
    );
    this.enableWarnings = this.getDefaultSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warningsAsError = this.getDefaultSettingsValue(
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );
    this.cStandard = this.getDefaultSettingsValue(
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD_UNIX,
    );
    this.cppStandard = this.getDefaultSettingsValue(
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );
    this.compilerArgs = this.getDefaultSettingsValue(
      'compilerArgs',
      SettingsProvider.DEFAULT_COMPILER_ARGS,
    );
    this.linkerArgs = this.getDefaultSettingsValue(
      'linkerArgs',
      SettingsProvider.DEFAULT_LINKER_ARGS,
    );
    this.includePaths = this.getDefaultSettingsValue(
      'includePaths',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );
    this.excludeSearch = this.getDefaultSettingsValue(
      'excludeSearch',
      SettingsProvider.DEFAULT_EXCLUDE_SEARCH,
    );
  }

  private storeSettings() {
    this.updateBasedOnEnv('cCompilerPath', this.cCompilerPath);
    this.updateBasedOnEnv('cppCompilerPath', this.cppCompilerPath);
    this.updateBasedOnEnv('debuggerPath', this.debuggerPath);

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

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

  private getDefaultSettingsValue(name: string, defaultValue: any) {
    if (this._configGlobal.has(name)) {
      return this._configGlobal.get(name, defaultValue);
    }

    return defaultValue;
  }

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

  private updateBasedOnEnv(settingsName: string, settingsValue: string) {
    if (this.operatingSystem === OperatingSystems.windows) {
      this.update(settingsName, replaceBackslashes(settingsValue));
    } else {
      this.update(settingsName, settingsValue);
    }
  }
}
