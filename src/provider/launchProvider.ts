import * as path from 'path';

import { JsonConfiguration, OperatingSystems } from '../utils/types';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';

const templateFileName = 'launch_template.json';
const outputFileName = 'launch.json';

export class LaunchProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string,
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }
  }

  public writeFileData() {
    const configName = 'C/C++ Runner: Debug Session';
    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    const configJsonTemplate: JsonConfiguration | undefined = readJsonFile(
      this.templatePath,
    );
    if (!configJsonTemplate) {
      return;
    }

    configJsonTemplate.configurations[0].name = configName;
    if (this.settings.debugger) {
      configJsonTemplate.configurations[0].MIMode = this.settings.debugger;
      configJsonTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      if (
        OperatingSystems.windows === this.settings.operatingSystem ||
        OperatingSystems.mac === this.settings.operatingSystem
      ) {
        configJsonTemplate.configurations[0].externalConsole = true;
      }
    }

    configJsonTemplate.configurations[0].cwd = this.activeFolder;
    const debugPath = path.join(this.activeFolder, 'build/Debug/outDebug');
    configJsonTemplate.configurations[0].program = debugPath;

    const configJsonOutput: JsonConfiguration | undefined = readJsonFile(
      this.outputPath,
    );

    if (!configJsonOutput) {
      writeJsonFile(this.outputPath, configJsonTemplate);
      return;
    }

    const configIdx = getLaunchConfigIndex(configJsonOutput, configName);

    if (
      configJsonOutput &&
      configJsonOutput.configurations.length === configIdx
    ) {
      configJsonOutput.configurations.push(
        configJsonTemplate.configurations[0],
      );
    } else {
      configJsonOutput.configurations[configIdx] =
        configJsonTemplate.configurations[0];
    }

    writeJsonFile(this.outputPath, configJsonOutput);
  }

  public updatFolderData(workspaceFolder: string, activeFolder: string) {
    this.activeFolder = activeFolder;
    super._updatFolderData(workspaceFolder);
  }
}
