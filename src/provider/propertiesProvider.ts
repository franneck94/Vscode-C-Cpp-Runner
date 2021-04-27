import { JsonConfiguration, Languages } from '../utils/types';
import { getLanguage, readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const templateFileName = 'properties_template.json';
const outputFileName = 'c_cpp_Properties.json';

export class PropertiesProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);
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
    config.name = triplet;
    config.intelliSenseMode = triplet;

    writeJsonFile(this.outputPath, configJson);
  }

  public updatFolderData(workspaceFolder: string) {
    super._updatFolderData(workspaceFolder);
  }
}
