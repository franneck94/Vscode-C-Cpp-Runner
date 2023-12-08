import * as path from 'path';

import {
  PROPERTIES_INCLUDE_PATTERN,
  PROPERTIES_OUTPUT_FILENAME,
  PROPERTIES_TEMPLATE_FILENAME,
} from '../params/params';
import {
  Architectures,
  CompilerSystems,
  OperatingSystems,
} from '../types/enums';
import { JsonPropertiesConfig } from '../types/interfaces';
import {
  pathExists,
  readJsonFile,
  replaceBackslashes,
  writeJsonFile,
} from '../utils/fileUtils';
import { commandExists } from '../utils/systemUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

export class PropertiesProvider extends FileProvider {
  protected lastConfig: JsonPropertiesConfig | undefined;
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string | undefined,
  ) {
    super(
      workspaceFolder,
      PROPERTIES_TEMPLATE_FILENAME,
      PROPERTIES_OUTPUT_FILENAME,
    );

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
    if (!this.settings.architecture) {
      arch = Architectures.x64;
    } else {
      arch = this.settings.architecture.toLowerCase();
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
      configLocalEntry.includePath = [PROPERTIES_INCLUDE_PATTERN];
      for (const path of this.settings.includePaths) {
        const includePathSet = new Set(configLocalEntry.includePath);
        if (
          !includePathSet.has(path) &&
          path !== PROPERTIES_INCLUDE_PATTERN &&
          !path.includes('$(default)')
        ) {
          configLocalEntry.includePath.push(path);
        }
      }
    } else {
      configLocalEntry.includePath = [PROPERTIES_INCLUDE_PATTERN];
    }
    const old_standard = ['c89', 'c99', 'gnu89', 'gnu99'].some(
      (ext) => this.settings.cStandard === ext,
    );

    configLocalEntry.cStandard = this.settings.cStandard
      ? this.settings.cStandard
      : this.settings.useMsvc
      ? SettingsProvider.DEFAULT_C_STANDARD_MSVC
      : '${default}';

    if (
      this.settings.operatingSystem === OperatingSystems.windows &&
      this.settings.useMsvc &&
      old_standard
    ) {
      configLocalEntry.cStandard = 'c11';
    }

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

        if (
          !ret ||
          !ret.p ||
          ret.p.includes('perl') ||
          ret.p.includes('ruby')
        ) {
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

  public changeCallback() {}
}
