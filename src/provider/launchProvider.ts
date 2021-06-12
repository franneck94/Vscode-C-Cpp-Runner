import * as path from 'path';

import { pathExists, readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { Debuggers, JsonConfiguration, OperatingSystems } from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'launch_template.json';
const OUTPUT_FILENAME = 'launch.json';
const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export class LaunchProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string,
  ) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    if (this.updateCheck()) {
      this.createFileData();
    }
  }

  protected updateCheck() {
    let doUpdate = false;

    if (!pathExists(this._outputPath)) {
      doUpdate = true;
    } else {
      const configJson: JsonConfiguration = readJsonFile(this._outputPath);
      if (configJson) {
        let foundConfig = false;

        configJson.configurations.forEach((config) => {
          const triplet: string = config.name;
          if (triplet.includes(this.settings.operatingSystem)) {
            foundConfig = true;
          }
        });

        if (!foundConfig) {
          doUpdate = true;
        }
      }
    }

    return doUpdate;
  }

  public writeFileData() {
    if (!this.workspaceFolder && !this.activeFolder) return;

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    const configJsonTemplate: JsonConfiguration | undefined = readJsonFile(
      this.templatePath,
    );

    if (!configJsonTemplate) return;

    configJsonTemplate.configurations[0].name = CONFIG_NAME;
    if (this.settings.debugger) {
      configJsonTemplate.configurations[0].MIMode = this.settings.debugger;
      configJsonTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      /* On Windows with Cygwin the internal console does not work properly. */
      if (
        OperatingSystems.windows === this.settings.operatingSystem &&
        this.settings.isCygwin
      ) {
        configJsonTemplate.configurations[0].externalConsole = true;
      }
    } else {
      configJsonTemplate.configurations[0].MIMode =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
      configJsonTemplate.configurations[0].miDebuggerPath =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
    }

    configJsonTemplate.configurations[0].cwd = this.activeFolder;
    const debugPath = path.join(this.activeFolder, 'build/Debug/outDebug');
    configJsonTemplate.configurations[0].program = debugPath;

    const configJsonOutput: JsonConfiguration | undefined = readJsonFile(
      this._outputPath,
    );

    if (!configJsonOutput) {
      writeJsonFile(this._outputPath, configJsonTemplate);
      return;
    }

    let configIdx = getLaunchConfigIndex(configJsonOutput, CONFIG_NAME);

    if (configIdx === undefined) {
      configIdx = configJsonOutput.configurations.length;
    }

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

    writeJsonFile(this._outputPath, configJsonOutput);
  }

  public updateFolderData(workspaceFolder: string, activeFolder: string) {
    this.activeFolder = activeFolder;
    super._updateFolderData(workspaceFolder);
  }

  /**
   * If launch.json is changed, update settings.json.
   */
  public changeCallback() {
    const configJsonOutput: JsonConfiguration | undefined = readJsonFile(
      this._outputPath,
    );

    if (!configJsonOutput) return;

    const configIdx = getLaunchConfigIndex(configJsonOutput, CONFIG_NAME);

    if (configIdx !== undefined) {
      const currentConfig = configJsonOutput.configurations[configIdx];

      if (currentConfig.miDebuggerPath != this.settings.debuggerPath) {
        this.settings.debuggerPath = currentConfig.miDebuggerPath;

        if (currentConfig.miDebuggerPath.includes(Debuggers.gdb)) {
          this.settings.setGDB(currentConfig.miDebuggerPath);
        } else if (currentConfig.miDebuggerPath.includes(Debuggers.lldb)) {
          this.settings.setLLDB(currentConfig.miDebuggerPath);
        }
      }
    } else {
      this.writeFileData();
    }
  }
}
