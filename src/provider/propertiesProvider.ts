import { JsonConfiguration, Languages } from '../utils/types';
import { getLanguage, readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

export class PropertiesProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public templateFileName: string,
    protected outputFileName: string,
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);
  }

  public writeFileData() {
    const configJson: JsonConfiguration = readJsonFile(this.templatePath);
    if (!configJson) {
      return;
    }

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

    config.cppStandard = this.settings.standardCpp;
    config.cStandard =
      this.settings.standardC === 'c90' ? 'c89' : this.settings.standardC;

    if (Languages.cpp === language) {
      config.compilerPath = this.settings.compilerPathCpp;
    } else {
      config.compilerPath = this.settings.compilerPathC;
    }
    config.name = triplet;
    config.intelliSenseMode = triplet;

    writeJsonFile(this.outputPath, configJson);
  }

  public updatFolderData(workspaceFolder: string) {
    super._updatFolderData(workspaceFolder);
  }
}
