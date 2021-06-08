import { getLanguage, readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { JsonConfiguration, Languages, OperatingSystems } from '../utils/types';
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
    const configJson: JsonConfiguration = readJsonFile(this.templatePath);
    if (!configJson) return;

    const language = getLanguage(this.workspaceFolder);
    const triplet =
      `${this.settings.operatingSystem}-` +
      `${this.settings.cCompiler}-` +
      `${this.settings.architecure}`;

    const config = configJson.configurations[0];
    config.compilerArgs = this.settings.warnings.split(' ');

    if (this.settings.compilerArgs) {
      config.compilerArgs = [
        ...config.compilerArgs,
        ...this.settings.compilerArgs.split(' '),
      ];
    } else {
      config.compilerArgs = [...this.settings.warnings.split(' ')];
    }

    if (this.settings.includePaths) {
      config.includePath = [
        ...config.includePath,
        ...this.settings.includePaths.split(' '),
      ];
    } else {
      config.includePath = [config.includePath[0]];
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
      this.settings.cCompilerPath = currentConfig.compilerPath;
      // TODO
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
  }
}
