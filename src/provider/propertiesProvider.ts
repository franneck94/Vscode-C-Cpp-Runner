import * as path from 'path';

import {
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import { commandExists } from '../utils/systemUtils';
import {
	CompilerSystems,
	JsonPropertiesConfig,
	JsonPropertiesConfigEntry,
	OperatingSystems,
} from '../utils/types';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'properties_template.json';
const OUTPUT_FILENAME = 'c_cpp_properties.json';
const INCLUDE_PATTERN = '${workspaceFolder}/**';

export class PropertiesProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string | undefined,
  ) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    const updateRequired = this.updateCheck();

    if (updateRequired && activeFolder) {
      this.createFileData();
    }
  }

  protected updateCheck() {
    if (!pathExists(this._outputPath)) return true;

    const configLocal: JsonPropertiesConfig = readJsonFile(this._outputPath);

    if (!configLocal) return true;

    const currentConfig = configLocal.configurations[0];

    if (currentConfig === undefined) return true;

    const triplet: string = currentConfig.name;
    if (!triplet.includes(this.settings.operatingSystem)) return true;

    if (
      this.settings.msvcBatchPath !==
        SettingsProvider.DEFAULT_MSVC_BATCH_PATH &&
      !currentConfig.intelliSenseMode.includes('msvc')
    ) {
      return true;
    }

    return false;
  }

  public async writeFileData() {
    let configLocal: JsonPropertiesConfig | undefined;

    if (!this.templatePath) return;

    if (!pathExists(this._outputPath)) {
      configLocal = readJsonFile(this.templatePath);
    } else {
      configLocal = readJsonFile(this._outputPath);
    }

    if (!configLocal) return;

    if (!this.settings.cCompilerPath && !this.settings.useMsvc) return;
    if (!this.settings.architecure) return;

    const os = this.settings.operatingSystem.toLowerCase();
    const arch = this.settings.architecure.toLowerCase();
    let compiler: CompilerSystems;

    if (this.settings.useMsvc) {
      compiler = CompilerSystems.msvc;
    } else if (this.settings.cCompilerPath) {
      compiler = this.settings.cCompilerPath.toLowerCase().includes('gcc')
        ? CompilerSystems.gcc
        : CompilerSystems.clang;
    } else {
      return;
    }

    const triplet = `${os}-${compiler}-${arch}`;

    const currentConfig = configLocal.configurations[0];

    if (currentConfig === undefined) return;

    if (this.settings.includePaths) {
      currentConfig.includePath = [INCLUDE_PATTERN];
      for (const path of this.settings.includePaths) {
        const includePathSet = new Set(currentConfig.includePath);
        if (path !== INCLUDE_PATTERN && !includePathSet.has(path)) {
          currentConfig.includePath.push(path);
        }
      }
    } else {
      currentConfig.includePath = [INCLUDE_PATTERN];
    }

    if (this.settings.cStandard) {
      currentConfig.cStandard = this.settings.useMsvc
        ? SettingsProvider.DEFAULT_C_STANDARD_MSVC
        : this.settings.cStandard;
    } else {
      currentConfig.cStandard = this.settings.useMsvc
        ? SettingsProvider.DEFAULT_C_STANDARD_MSVC
        : '${default}';
    }

    if (this.settings.cppStandard) {
      currentConfig.cppStandard = this.settings.cppStandard;
    } else {
      currentConfig.cppStandard = '${default}';
    }

    if (this.settings.useMsvc) {
      currentConfig.compilerPath = path.join(
        this.settings.msvcToolsPath,
        SettingsProvider.MSVC_COMPILER_NAME,
      );
    } else {
      if (pathExists(this.settings.cCompilerPath)) {
        currentConfig.compilerPath = this.settings.cCompilerPath;
      } else {
        // non-absolute compiler path
        const ret = await commandExists(this.settings.cCompilerPath);

        if (!ret || !ret.p) {
          currentConfig.compilerPath = this.settings.cCompilerPath;
        } else {
          currentConfig.compilerPath = replaceBackslashes(ret.p);
        }
      }
    }

    // Since C/C++ Extension Version 1.4.0 cygwin is a linux triplet
    if (
      this.settings.isCygwin &&
      !this.settings.useMsvc &&
      this.settings.operatingSystem === OperatingSystems.windows
    ) {
      currentConfig.name = triplet.replace('windows', 'windows-cygwin');
      currentConfig.intelliSenseMode = triplet.replace('windows', 'linux');
    } else {
      currentConfig.name = triplet;
      currentConfig.intelliSenseMode = triplet;
    }

    writeJsonFile(this._outputPath, configLocal);
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  public changeCallback() {
    const configLocal: JsonPropertiesConfig | undefined = readJsonFile(
      this._outputPath,
    );

    if (!configLocal) return;

    const currentConfig: JsonPropertiesConfigEntry | undefined =
      configLocal.configurations[0];

    if (currentConfig === undefined) return;

    const absoluteCompilerPath = !pathExists(this.settings.cCompilerPath);

    if (
      absoluteCompilerPath &&
      currentConfig.compilerPath !== this.settings.cCompilerPath &&
      currentConfig.compilerPath !== this.settings.cppCompilerPath
    ) {
      this.settings.cCompilerPath = currentConfig.compilerPath;

      const compilerSystem = this.settings.cCompilerPath.includes('gcc')
        ? CompilerSystems.gcc
        : CompilerSystems.clang;

      if (compilerSystem === CompilerSystems.gcc) {
        this.settings.cppCompilerPath = currentConfig.compilerPath.replace(
          'gcc',
          'g++',
        );
      } else {
        this.settings.cppCompilerPath = currentConfig.compilerPath.replace(
          'clang',
          'clang++',
        );
      }
    }

    if (
      currentConfig.cStandard !== '${default}' &&
      currentConfig.cStandard !== this.settings.cStandard
    ) {
      this.settings.cStandard = currentConfig.cStandard;
    }

    if (
      currentConfig.cppStandard !== '${default}' &&
      currentConfig.cppStandard !== this.settings.cppStandard
    ) {
      this.settings.cppStandard = currentConfig.cppStandard;
    }

    const includeArgs = currentConfig.includePath.filter(
      (path: string) => path !== INCLUDE_PATTERN,
    );
    this.settings.includePaths = includeArgs;

    this.settings.writeFileData();
  }
}
