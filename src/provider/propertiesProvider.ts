import * as path from 'path';

import {
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import { arraysEqual } from '../utils/general';
import { commandExists } from '../utils/systemUtils';
import {
	Architectures,
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
  protected lastConfig: JsonPropertiesConfig | undefined;
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

    if (pathExists(this._outputPath)) {
      this.lastConfig = readJsonFile(this._outputPath);
    }
  }

  protected updateCheck() {
    if (!pathExists(this._outputPath)) return true;

    const currentConfig: JsonPropertiesConfig = readJsonFile(this._outputPath);

    if (!currentConfig) return true;

    const currentConfigEntry = currentConfig.configurations[0];

    if (currentConfigEntry === undefined) return true;

    const triplet: string = currentConfigEntry.name;
    if (!triplet.includes(this.settings.operatingSystem)) return true;

    if (
      this.settings.useMsvc &&
      !currentConfigEntry.intelliSenseMode.includes('msvc')
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

    const os = this.settings.operatingSystem.toLowerCase();

    let arch: string;
    if (!this.settings.architecure) {
      arch = Architectures.x64;
    } else {
      arch = this.settings.architecure.toLowerCase();
    }

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

    const configLocalEntry = configLocal.configurations[0];

    if (configLocalEntry === undefined) return;

    if (this.settings.includePaths.length > 0) {
      configLocalEntry.includePath = [INCLUDE_PATTERN];
      for (const path of this.settings.includePaths) {
        const includePathSet = new Set(configLocalEntry.includePath);
        if (
          !includePathSet.has(path) &&
          path !== INCLUDE_PATTERN &&
          path !== '$(default)'
        ) {
          configLocalEntry.includePath.push(path);
        }
      }
    } else {
      configLocalEntry.includePath = [INCLUDE_PATTERN];
    }

    configLocalEntry.cStandard = this.settings.cStandard
      ? this.settings.cStandard
      : this.settings.useMsvc
      ? SettingsProvider.DEFAULT_C_STANDARD_MSVC
      : '${default}';

    configLocalEntry.cppStandard = this.settings.cppStandard
      ? this.settings.cppStandard
      : '${default}';

    if (this.settings.useMsvc) {
      configLocalEntry.compilerPath = path.join(
        this.settings.msvcToolsPath,
        SettingsProvider.MSVC_COMPILER_NAME,
      );
    } else {
      if (pathExists(this.settings.cCompilerPath)) {
        configLocalEntry.compilerPath = this.settings.cCompilerPath;
      } else {
        // non-absolute compiler path
        const ret = await commandExists(this.settings.cCompilerPath);

        if (!ret || !ret.p) {
          configLocalEntry.compilerPath = this.settings.cCompilerPath;
        } else {
          configLocalEntry.compilerPath = replaceBackslashes(ret.p);
        }
      }
    }

    // Since C/C++ Extension Version 1.4.0 cygwin is a linux triplet
    if (
      this.settings.isCygwin &&
      !this.settings.useMsvc &&
      this.settings.operatingSystem === OperatingSystems.windows
    ) {
      configLocalEntry.name = triplet.replace('windows', 'windows-cygwin');
      configLocalEntry.intelliSenseMode = triplet.replace('windows', 'linux');
    } else {
      configLocalEntry.name = triplet;
      configLocalEntry.intelliSenseMode = triplet;
    }

    writeJsonFile(this._outputPath, configLocal);
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  public changeCallback() {
    const currentConfig: JsonPropertiesConfig | undefined = readJsonFile(
      this._outputPath,
    );

    if (!this.lastConfig) {
      this.lastConfig = readJsonFile(this._outputPath);

      if (!this.lastConfig) return;
    }

    if (!currentConfig) return;

    const currentConfigEntry: JsonPropertiesConfigEntry | undefined =
      currentConfig.configurations[0];

    if (currentConfigEntry === undefined) return;

    const lastConfigEntry: JsonPropertiesConfigEntry | undefined =
      this.lastConfig.configurations[0];

    if (lastConfigEntry === undefined) return;

    let updated = false;

    if (currentConfigEntry.cStandard !== lastConfigEntry.cStandard) {
      this.settings.cStandard =
        currentConfigEntry.cStandard !== '${default}'
          ? currentConfigEntry.cStandard
          : '';
      updated = true;
    }

    if (currentConfigEntry.cppStandard !== lastConfigEntry.cppStandard) {
      this.settings.cppStandard =
        currentConfigEntry.cppStandard !== '${default}'
          ? currentConfigEntry.cppStandard
          : '';
      updated = true;
    }

    if (
      currentConfigEntry.compilerPath !== lastConfigEntry.compilerPath &&
      !currentConfigEntry.compilerPath.includes('cl.exe')
    ) {
      this.settings.cCompilerPath = currentConfigEntry.compilerPath;
      updated = true;
    }

    if (
      !arraysEqual(currentConfigEntry.includePath, lastConfigEntry.includePath)
    ) {
      this.settings.includePaths = currentConfigEntry.includePath.filter(
        (path: string) => path !== INCLUDE_PATTERN && path !== '$(default)',
      );
      updated = true;
    }

    if (updated) {
      this.settings.writeFileData();

      this.lastConfig = currentConfig;
    }
  }
}
