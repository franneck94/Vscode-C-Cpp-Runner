import * as path from 'path';
import {
  getLanguage,
  pathExists,
  readJsonFile,
  writeJsonFile,
} from '../utils/fileUtils';
import {
  Compilers,
  JsonConfiguration,
  Languages,
  OperatingSystems,
} from '../utils/types';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'properties_template.json';
const OUTPUT_FILENAME = 'c_cpp_properties.json';

export class PropertiesProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
  ) {
    super(settings, workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);
  }

  public writeFileData() {
    let configJson: JsonConfiguration | undefined;

    if (!pathExists(this._outputPath)) {
      configJson = readJsonFile(this.templatePath);
    } else {
      configJson = readJsonFile(this._outputPath);
    }

    if (!configJson) return;

    const language = getLanguage(this.workspaceFolder);
    const triplet =
      `${this.settings.operatingSystem}-` +
      `${this.settings.cCompiler}-` +
      `${this.settings.architecure}`;

    const config = configJson.configurations[0];

    if (config.compilerArgs.length === 1 && config.compilerArgs[0] === '') {
      config.compilerArgs = [];
    }

    if (this.settings.warnings) {
      const warnings = this.settings.warnings.split(' ');
      config.compilerArgs = [];
      for (let warning of warnings) {
        const compilerArgsSet = new Set(config.compilerArgs);
        if (!compilerArgsSet.has(warning)) {
          config.compilerArgs.push(warning);
        }
      }
    }

    if (this.settings.compilerArgs) {
      const args = this.settings.compilerArgs.split(' ');
      config.compilerArgs = [];
      for (let arg of args) {
        const compilerArgsSet = new Set(config.compilerArgs);
        if (!compilerArgsSet.has(arg)) {
          config.compilerArgs.push(arg);
        }
      }
    }

    const pattern = '${workspaceFolder}/**';
    if (this.settings.includePaths) {
      const paths = this.settings.includePaths.split(' ');
      config.includePath = [pattern];
      for (let path of paths) {
        const includePathSet = new Set(config.includePath);
        if (path !== pattern && !includePathSet.has(path)) {
          config.includePath.push(path);
        }
      }
    } else {
      config.includePath = [pattern];
    }

    if (this.settings.cStandard) {
      config.cStandard = this.settings.cStandard;
    } else {
      config.cStandard = '${default}';
    }

    if (this.settings.cppStandard) {
      config.cppStandard = this.settings.cppStandard;
    } else {
      config.cppStandard = '${default}';
    }

    if (Languages.cpp === language) {
      config.compilerPath = this.settings.cppCompilerPath;
    } else {
      config.compilerPath = this.settings.cCompilerPath;
    }

    // Since C/C++ Extension Version 1.4.0 cygwin is a linux triplet
    if (
      this.settings.isCygwin &&
      this.settings.operatingSystem == OperatingSystems.windows
    ) {
      config.name = triplet.replace('windows', 'windows-cygwin');
      config.intelliSenseMode = triplet.replace('windows', 'linux');
    } else {
      config.name = triplet;
      config.intelliSenseMode = triplet;
    }

    writeJsonFile(this._outputPath, configJson);
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  public changeCallback() {
    const configJson: JsonConfiguration = readJsonFile(this._outputPath);

    if (!configJson) return;

    const currentConfig = configJson.configurations[0];

    if (
      currentConfig.compilerPath != this.settings.cCompilerPath &&
      currentConfig.compilerPath != this.settings.cppCompilerPath
    ) {
      let compilerName = currentConfig.compilerPath;
      this.settings.cCompilerPath = currentConfig.compilerPath;

      if (compilerName.includes('/') || compilerName.includes('\\')) {
        compilerName = path.basename(compilerName);
      }
      if (compilerName.includes('.exe')) {
        compilerName = compilerName.replace('.exe', '');
      }

      if (compilerName.includes(Compilers.gcc)) {
        this.settings.setGcc(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.clang)) {
        this.settings.setClang(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.clangpp)) {
        this.settings.setClangpp(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.gpp)) {
        this.settings.setGpp(currentConfig.compilerPath);
      }
    }

    if (
      currentConfig.cStandard != '${default}' &&
      currentConfig.cStandard != this.settings.cStandard
    ) {
      this.settings.cStandard = currentConfig.cStandard;
      this.settings.update('cStandard', currentConfig.cStandard);
    }

    if (
      currentConfig.cppStandard != '${default}' &&
      currentConfig.cppStandard != this.settings.cppStandard
    ) {
      this.settings.cppStandard = currentConfig.cppStandard;
      this.settings.update('cppStandard', currentConfig.cppStandard);
    }

    const args: Set<string> = new Set(currentConfig.compilerArgs);

    const warningArgs = [...args].filter((arg: string) => {
      return arg.includes('-W');
    });
    const compilerArgs = [...args].filter((arg: string) => {
      return !arg.includes('-W');
    });

    const warningsStr = warningArgs.join(' ');
    if (warningsStr !== SettingsProvider.DEFAULT_WARNINGS) {
      this.settings.warnings = warningsStr;
      this.settings.update('warnings', this.settings.warnings);
    }

    const argsStr = compilerArgs.join(' ');
    if (argsStr !== SettingsProvider.DEFAULT_COMPILER_ARGS) {
      this.settings.compilerArgs = argsStr;
      this.settings.update('compilerArgs', this.settings.compilerArgs);
    }

    const pattern = '${workspaceFolder}/**';
    const includePaths: Set<string> = new Set(
      currentConfig.includePath.filter((path: string) => {
        return path != pattern;
      }),
    );

    const includeStr = [...includePaths].join(' ');
    if (includeStr !== SettingsProvider.DEFAULT_INCLUDE_PATHS) {
      this.settings.includePaths = includeStr;
      this.settings.update('includePaths', this.settings.includePaths);
    }
  }
}
