import * as path from 'path';

import { JsonConfiguration, OperatingSystems } from '../utils/types';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

export class LaunchProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string,
    protected templateFileName: string,
    protected outputFileName: string,
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    const configJson: JsonConfiguration = readJsonFile(inputFilePath);

    if (!configJson) {
      return;
    }

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
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

    configJson.configurations[0].cwd = this.activeFolder;
    const debugPath = path.join(this.activeFolder, 'build/Debug/outDebug');
    configJson.configurations[0].program = debugPath;

    writeJsonFile(outFilePath, configJson);
  }

  public updatFolderData(workspaceFolder: string, activeFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this.activeFolder = activeFolder;
  }
}
