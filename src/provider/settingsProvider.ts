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
	CompilerSystems,
	JsonPropertiesConfig,
	JsonPropertiesConfigEntry,
	JsonSettings,
	OperatingSystems,
} from '../utils/types';
import { FileProvider } from './fileProvider';

const OUTPUT_FILENAME = 'settings.json';
const EXTENSION_NAME = 'C_Cpp_Runner';

export class SettingsProvider extends FileProvider {
  static DEFAULT_C_COMPILER_PATH = 'gcc';
  static DEFAULT_CPP_COMPILER_PATH = 'g++';
  static DEFAULT_DEBUGGER_PATH = 'gdb';
  static DEFAULT_MSVC_BATCH_PATH =
    'C:/Program Files/Microsoft Visual Studio/VR_NR/Community/VC/Auxiliary/Build/vcvarsall.bat';
  static DEFAULT_MSVC_TOOLS_PATH = '';
  static DEFAULT_C_STANDARD_UNIX = '';
  static DEFAULT_C_STANDARD_MSVC = 'c11';
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

  static DEFAULT_USE_MSVC = false;
  static MSVC_COMPILER_NAME = 'cl.exe';

  // Workspace data
  private _configGlobal = vscode.workspace.getConfiguration(EXTENSION_NAME);

  // Machine information
  public operatingSystem = getOperatingSystem();
  public architecture: Architectures | undefined;
  public isCygwin: boolean = false;

  // Settings
  public cCompilerPath: string = SettingsProvider.DEFAULT_C_COMPILER_PATH;
  public cppCompilerPath: string = SettingsProvider.DEFAULT_CPP_COMPILER_PATH;
  public debuggerPath: string = SettingsProvider.DEFAULT_DEBUGGER_PATH;
  public msvcBatchPath: string = SettingsProvider.DEFAULT_MSVC_BATCH_PATH;
  public msvcToolsPath: string = SettingsProvider.DEFAULT_MSVC_TOOLS_PATH;
  public useMsvc: boolean = SettingsProvider.DEFAULT_USE_MSVC;
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
    super(workspaceFolder, undefined, OUTPUT_FILENAME);

    const settingsFileMissing = this.localFileExist('settings.json');
    const settingsMissing = this.updateCheck();
    const propertiesFileMissing = this.localFileExist('c_cpp_properties.json');

    const allInfoMissing =
      settingsMissing && propertiesFileMissing && activeFolder;
    const onlySettingsMissing =
      settingsFileMissing && !propertiesFileMissing && activeFolder;

    if (allInfoMissing) {
      this.loadGlobalSettings();
      this.createFileData();
      this.getArchitecture();
      return;
    }

    if (onlySettingsMissing) {
      this.getSettingsFromProperties();
      this.createFileData();
      this.getArchitecture();
      return;
    }

    if (activeFolder) {
      this.loadLocalSettings();
      this.getArchitecture();
      return;
    }
  }

  protected updateCheck() {
    if (!pathExists(this._outputPath)) {
      return true;
    } else if (!this.commandsAlreadyStored()) {
      return true;
    }

    return false;
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
    this.storeSettings();
  }

  public deleteCallback() {
    this.storeSettings();
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
    if (this.msvcBatchPath === SettingsProvider.DEFAULT_MSVC_BATCH_PATH) {
      if (pathExists(this.msvcBatchPath.replace('VR_NR', '2022'))) {
        this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2022');
        this.update('msvcBatchPath', this.msvcBatchPath);
      } else if (pathExists(this.msvcBatchPath.replace('VR_NR', '2017'))) {
        this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2017');
        this.update('msvcBatchPath', this.msvcBatchPath);
      } else if (pathExists(this.msvcBatchPath.replace('VR_NR', '2015'))) {
        this.msvcBatchPath = this.msvcBatchPath.replace('VR_NR', '2015');
        this.update('msvcBatchPath', this.msvcBatchPath);
      } else {
        this.msvcBatchPath = '';
        this.update('msvcBatchPath', this.msvcBatchPath);
      }
    }
    this.useMsvc = this.getSettingsValue(
      settingsLocal,
      'useMsvc',
      SettingsProvider.DEFAULT_USE_MSVC,
    );

    if (this.useMsvc) {
      this.searchMsvcToolsPath();
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

    if (this.useMsvc && !msvcWarnings) {
      this.warnings = SettingsProvider.DEFAULT_WARNINGS_MSVC;
    } else if (!this.useMsvc && msvcWarnings) {
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
  }

  private getSettingsFromProperties() {
    const propertiesPath = path.join(
      this._vscodeDirectory,
      'c_cpp_properties.json',
    );
    const propertiesConfig: JsonPropertiesConfig | undefined =
      readJsonFile(propertiesPath);

    if (!propertiesConfig) return;

    const currentConfigEntry: JsonPropertiesConfigEntry | undefined =
      propertiesConfig.configurations[0];

    if (!currentConfigEntry) return;

    /* Mandatory in settings.json */
    this.cCompilerPath = this.getPropertiesValue(
      currentConfigEntry,
      'compilerPath',
      this.cCompilerPath,
    );

    const isGccBased = this.cCompilerPath.includes(CompilerSystems.gcc);
    const isClangBased = this.cCompilerPath.includes(CompilerSystems.clang);

    if (isGccBased) {
      const cppPath = this.cCompilerPath.replace('gcc', 'g++');
      const dbgPath = this.cCompilerPath.replace('gcc', 'gdb');
      this.cppCompilerPath = cppPath;
      this.debuggerPath = dbgPath;
    } else if (isClangBased) {
      const cppPath = this.cCompilerPath.replace('clang', 'clang++');
      const dbgPath = this.cCompilerPath.replace('clang', 'lldb');
      this.cppCompilerPath = path.join(cppPath);
      this.debuggerPath = dbgPath;
    }

    /* Optional in settings.json */
    const _cStandard: string = this.getPropertiesValue(
      currentConfigEntry,
      'cStandard',
      this.cStandard,
    );
    this.cStandard =
      _cStandard !== '${default}'
        ? _cStandard
        : SettingsProvider.DEFAULT_C_STANDARD_UNIX;

    const _cppStandard: string = this.getPropertiesValue(
      currentConfigEntry,
      'cppStandard',
      this.cppStandard,
    );
    this.cppStandard =
      _cppStandard !== '${default}'
        ? _cppStandard
        : SettingsProvider.DEFAULT_CPP_STANDARD;

    const _includePaths: string[] = this.getPropertiesValue(
      currentConfigEntry,
      'includePath',
      this.includePaths,
    );
    this.includePaths =
      _includePaths.length !== 0
        ? _includePaths
        : SettingsProvider.DEFAULT_INCLUDE_PATHS;
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
      this.architecture === Architectures.x64 ||
      this.architecture === undefined
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
    if (this.useMsvc) {
      this.architecture = Architectures.x64;
      this.isCygwin = false;
      return;
    }

    if (this.cCompilerPath) {
      const ret = getCompilerArchitecture(this.cCompilerPath);
      this.architecture = ret.architecture;
      this.isCygwin = ret.isCygwin;
      return;
    }

    if (this.cppCompilerPath) {
      const ret = getCompilerArchitecture(this.cppCompilerPath);
      this.architecture = ret.architecture;
      this.isCygwin = ret.isCygwin;
      return;
    }

    this.architecture = Architectures.x64;
    this.isCygwin = false;
  }

  public reset() {
    this.loadGlobalSettings();
    this.storeSettings();
  }

  private loadGlobalSettings() {
    /* Mandatory in settings.json */
    this.cCompilerPath = this.getGlobalSettingsValue(
      'cCompilerPath',
      SettingsProvider.DEFAULT_C_COMPILER_PATH,
    );
    this.cppCompilerPath = this.getGlobalSettingsValue(
      'cppCompilerPath',
      SettingsProvider.DEFAULT_CPP_COMPILER_PATH,
    );
    this.debuggerPath = this.getGlobalSettingsValue(
      'debuggerPath',
      SettingsProvider.DEFAULT_DEBUGGER_PATH,
    );
    this.msvcBatchPath = this.getGlobalSettingsValue(
      'msvcBatchPath',
      SettingsProvider.DEFAULT_MSVC_BATCH_PATH,
    );
    this.msvcToolsPath = this.getGlobalSettingsValue(
      'msvcToolsPath',
      SettingsProvider.DEFAULT_MSVC_TOOLS_PATH,
    );
    this.useMsvc = this.getGlobalSettingsValue(
      'useMsvc',
      SettingsProvider.DEFAULT_USE_MSVC,
    );

    /* Optional in settings.json */
    this.enableWarnings = this.getGlobalSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warnings = this.getGlobalSettingsValue(
      'warnings',
      SettingsProvider.DEFAULT_WARNINGS_UNIX,
    );
    this.enableWarnings = this.getGlobalSettingsValue(
      'enableWarnings',
      SettingsProvider.DEFAULT_ENABLE_WARNINGS,
    );
    this.warningsAsError = this.getGlobalSettingsValue(
      'warningsAsError',
      SettingsProvider.DEFAULT_WARNINGS_AS_ERRORS,
    );
    this.cStandard = this.getGlobalSettingsValue(
      'cStandard',
      SettingsProvider.DEFAULT_C_STANDARD_UNIX,
    );
    this.cppStandard = this.getGlobalSettingsValue(
      'cppStandard',
      SettingsProvider.DEFAULT_CPP_STANDARD,
    );
    this.compilerArgs = this.getGlobalSettingsValue(
      'compilerArgs',
      SettingsProvider.DEFAULT_COMPILER_ARGS,
    );
    this.linkerArgs = this.getGlobalSettingsValue(
      'linkerArgs',
      SettingsProvider.DEFAULT_LINKER_ARGS,
    );
    this.includePaths = this.getGlobalSettingsValue(
      'includePaths',
      SettingsProvider.DEFAULT_INCLUDE_PATHS,
    );
    this.excludeSearch = this.getGlobalSettingsValue(
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
    this.update('useMsvc', this.useMsvc);

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

  private getGlobalSettingsValue(name: string, defaultValue: any) {
    const fullSettingInfo = this._configGlobal.inspect(name);
    return fullSettingInfo?.globalValue
      ? fullSettingInfo.globalValue
      : defaultValue;
  }

  private getSettingsValue(
    settingsLocal: JsonSettings | undefined,
    name: string,
    defaultValue: any,
  ) {
    const settingName = `${EXTENSION_NAME}.${name}`;

    if (settingsLocal && settingsLocal[settingName] !== undefined) {
      return settingsLocal[settingName];
    }

    return this.getGlobalSettingsValue(name, defaultValue);
  }

  private getPropertiesValue(
    properties: JsonPropertiesConfigEntry | undefined,
    name: keyof JsonPropertiesConfigEntry,
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
