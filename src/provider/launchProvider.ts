import * as path from 'path';

import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { JsonConfiguration, OperatingSystems } from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'launch_template.json';
const OUTPUT_FILENAME = 'launch.json';

export class LaunchProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string,
  ) {
    super(settings, workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

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
    if (!configJsonTemplate) return;

    configJsonTemplate.configurations[0].name = configName;
    if (this.settings.debugger) {
      configJsonTemplate.configurations[0].MIMode = this.settings.debugger;
      configJsonTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      if (OperatingSystems.windows === this.settings.operatingSystem) {
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

    if (!configIdx) return;

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

  public updateFolderData(workspaceFolder: string, activeFolder: string) {
    this.activeFolder = activeFolder;
    super._updateFolderData(workspaceFolder);
  }
}
