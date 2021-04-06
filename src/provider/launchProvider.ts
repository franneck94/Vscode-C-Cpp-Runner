import * as path from 'path';

import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';
import { readJsonFile, writeJsonFile } from '../utils';
import { JsonConfiguration, OperatingSystems } from '../types';

export class LaunchProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public pickedFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);

    if (!this.pickedFolder) {
      this.pickedFolder = this.workspaceFolder;
    }
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    const configJson: JsonConfiguration = readJsonFile(inputFilePath);

    if (!configJson) {
      return;
    }

    if (!this.pickedFolder) {
      this.pickedFolder = this.workspaceFolder;
    }

    configJson.configurations[0].name = `Launch: Debug Program`;
    if (this.settings.debugger) {
      configJson.configurations[0].MIMode = this.settings.debugger;
      configJson.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      if (OperatingSystems.windows === this.settings.operatingSystem) {
        // XXX: Either gdb or the C/C++ extension has issues on windows with the internal terminal
        configJson.configurations[0].externalConsole = true;
      }
    }

    configJson.configurations[0].cwd = this.pickedFolder;
    const debugPath = path.join(this.pickedFolder, 'build/Debug/outDebug');
    configJson.configurations[0].program = debugPath;

    writeJsonFile(outFilePath, configJson);
  }
}
