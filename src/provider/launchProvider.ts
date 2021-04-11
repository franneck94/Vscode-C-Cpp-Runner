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
    const configJsonTemplate: JsonConfiguration | undefined = readJsonFile(
      inputFilePath,
    );
    const configJsonOutput: JsonConfiguration | undefined = readJsonFile(
      outFilePath,
    );

    if (!configJsonTemplate) {
      return;
    }

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    let configIdx = 0;
    const configName = 'Launch: Debug Program';

    if (configJsonOutput) {
      configJsonOutput.configurations.forEach((config) => {
        if (config.name !== configName) {
          configIdx++;
        }
      });
    }

    configJsonTemplate.configurations[0].name = configName;
    if (this.settings.debugger) {
      configJsonTemplate.configurations[0].MIMode = this.settings.debugger;
      configJsonTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      if (OperatingSystems.windows === this.settings.operatingSystem) {
        // XXX: Either gdb or the C/C++ extension has issues on windows with the internal terminal
        configJsonTemplate.configurations[0].externalConsole = true;
      }
    }

    configJsonTemplate.configurations[0].cwd = this.activeFolder;
    const debugPath = path.join(this.activeFolder, 'build/Debug/outDebug');
    configJsonTemplate.configurations[0].program = debugPath;

    if (
      configJsonOutput &&
      configJsonOutput.configurations.length === configIdx
    ) {
      configJsonOutput.configurations.push(
        configJsonTemplate.configurations[0],
      );
      writeJsonFile(outFilePath, configJsonOutput);
    } else {
      writeJsonFile(outFilePath, configJsonTemplate);
    }
  }

  public updatFolderData(workspaceFolder: string, activeFolder: string) {
    this.workspaceFolder = workspaceFolder;
    this.activeFolder = activeFolder;
  }
}
