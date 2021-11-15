import * as path from 'path';

import { pathExists, readJsonFile, writeJsonFile } from '../utils/fileUtils';
import {
	Architectures,
	Builds,
	Debuggers,
	JsonConfiguration,
	OperatingSystems,
} from '../utils/types';
import { getLaunchConfigIndex } from '../utils/vscodeUtils';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'launch_template.json';
const OUTPUT_FILENAME = 'launch.json';
const CONFIG_NAME = 'C/C++ Runner: Debug Session';

export class LaunchProvider extends FileProvider {
  public buildMode: Builds = Builds.debug;

  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string,
  ) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    const updateRequired = this.updateCheck();

    if (updateRequired) {
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

    const launchTemplate: JsonConfiguration | undefined = readJsonFile(
      this.templatePath,
    );

    if (!launchTemplate) return;

    launchTemplate.configurations[0].name = CONFIG_NAME;
    if (this.settings.debugger) {
      launchTemplate.configurations[0].MIMode = this.settings.debugger;
      launchTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      /* On Windows with Cygwin the internal console does not work properly. */
      if (
        OperatingSystems.windows === this.settings.operatingSystem &&
        this.settings.isCygwin
      ) {
        launchTemplate.configurations[0].externalConsole = true;
      }
    } else {
      launchTemplate.configurations[0].MIMode =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
      launchTemplate.configurations[0].miDebuggerPath =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
    }

    if (OperatingSystems.mac === this.settings.operatingSystem) {
      launchTemplate.configurations[0].stopAtEntry = true;
      launchTemplate.configurations[0].externalConsole = true;

      if (launchTemplate.configurations[0].setupCommands) {
        delete launchTemplate.configurations[0].setupCommands;
      }
      if (launchTemplate.configurations[0].miDebuggerPath) {
        delete launchTemplate.configurations[0].miDebuggerPath;
      }

      if (this.settings.architecure === Architectures.ARM64) {
        launchTemplate.configurations[0].type = 'lldb';
      }
    }

    launchTemplate.configurations[0].cwd = this.activeFolder;
    const debugPath = path.join(
      this.activeFolder,
      `build/${this.buildMode}/out${this.buildMode}`,
    );
    launchTemplate.configurations[0].program = debugPath;

    const launchLocal: JsonConfiguration | undefined = readJsonFile(
      this._outputPath,
    );

    if (!launchLocal) {
      writeJsonFile(this._outputPath, launchTemplate);
      return;
    }

    let configIdx = getLaunchConfigIndex(launchLocal, CONFIG_NAME);

    if (configIdx === undefined) {
      configIdx = launchLocal.configurations.length;
    }

    if (launchLocal && launchLocal.configurations.length === configIdx) {
      launchLocal.configurations.push(launchTemplate.configurations[0]);
    } else {
      launchLocal.configurations[configIdx] = launchTemplate.configurations[0];
    }

    writeJsonFile(this._outputPath, launchLocal);
  }

  public updateFolderData(workspaceFolder: string, activeFolder: string) {
    this.activeFolder = activeFolder;
    super._updateFolderData(workspaceFolder);
  }

  public updateModeData(buildMode: Builds) {
    this.buildMode = buildMode;
  }

  public changeCallback() {
    const launchLocal: JsonConfiguration | undefined = readJsonFile(
      this._outputPath,
    );

    if (!launchLocal) return;

    const configIdx = getLaunchConfigIndex(launchLocal, CONFIG_NAME);

    if (configIdx !== undefined) {
      const currentConfig = launchLocal.configurations[configIdx];

      if (currentConfig.miDebuggerPath !== this.settings.debuggerPath) {
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
