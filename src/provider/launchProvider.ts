import * as path from 'path';

import {
	getOccurenceIndicies,
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
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
  public argumentsString: string[] | undefined;

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

    if (
      this.settings.operatingSystem === OperatingSystems.windows &&
      this.settings.isMsvc
    ) {
      this.msvcBasedDebugger(launchTemplate);
    } else {
      this.unixBasedDebugger(launchTemplate);
    }

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

  public updateArgumentsData(argumentsString: string | undefined) {
    if (argumentsString === undefined) return;

    if (argumentsString === '') {
      this.argumentsString = [];
      return;
    }

    if (!argumentsString.includes(' ')) {
      this.argumentsString = [argumentsString];
    }

    if (!argumentsString.includes('"')) {
      this.argumentsString = argumentsString.split(' ');
      return;
    }

    const indicies = getOccurenceIndicies(argumentsString, '"');
    this.argumentsString = [];

    const strsToReplace: string[] = [];
    if (!indicies || indicies.length < 2) return;

    for (let i = 0; i < indicies.length; i += 2) {
      const sub = argumentsString.slice(
        (indicies[i] as number) + 1,
        indicies[i + 1],
      );
      this.argumentsString.push(sub);
      strsToReplace.push(sub);
    }

    for (const strReplace of strsToReplace) {
      argumentsString = argumentsString.replace(strReplace, '');
    }

    argumentsString = argumentsString.replace(/"/g, '');
    if (argumentsString.startsWith(' ')) {
      argumentsString = argumentsString.slice(1);
    }
    if (argumentsString.endsWith(' ')) {
      argumentsString = argumentsString.slice(0, argumentsString.length - 2);
    }

    this.argumentsString.push(
      ...argumentsString.split(' ').filter((str: string) => Boolean(str)),
    );

    this.argumentsString.map((str: string) => str.replace(/"/g, ''));
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

  private msvcBasedDebugger(launchTemplate: JsonConfiguration) {
    launchTemplate.configurations[0].name = CONFIG_NAME;

    delete launchTemplate.configurations[0].MIMode;
    delete launchTemplate.configurations[0].miDebuggerPath;
    delete launchTemplate.configurations[0].setupCommands;

    launchTemplate.configurations[0].type = 'cppvsdbg';

    if (this.argumentsString) {
      launchTemplate.configurations[0].args = this.argumentsString;
    } else {
      launchTemplate.configurations[0].args = [];
    }

    launchTemplate.configurations[0].cwd = replaceBackslashes(
      this.activeFolder,
    );

    const debugPath = path.join(
      this.activeFolder,
      `build/${this.buildMode}/out${this.buildMode}`,
    );
    launchTemplate.configurations[0].program = replaceBackslashes(debugPath);

    return launchTemplate;
  }

  private unixBasedDebugger(launchTemplate: JsonConfiguration) {
    launchTemplate.configurations[0].name = CONFIG_NAME;
    if (this.settings.debugger) {
      launchTemplate.configurations[0].MIMode = this.settings.debugger;
      launchTemplate.configurations[0].miDebuggerPath = this.settings.debuggerPath;
    } else {
      launchTemplate.configurations[0].MIMode =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
      launchTemplate.configurations[0].miDebuggerPath =
        SettingsProvider.DEFAULT_DEBUGGER_PATH;
    }

    if (OperatingSystems.mac === this.settings.operatingSystem) {
      launchTemplate.configurations[0].stopAtEntry = true;
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

    if (this.argumentsString && this.argumentsString.length > 0) {
      launchTemplate.configurations[0].args = this.argumentsString;
    } else {
      launchTemplate.configurations[0].args = [];
    }

    if (this.settings.operatingSystem === OperatingSystems.windows) {
      launchTemplate.configurations[0].cwd = replaceBackslashes(
        this.activeFolder,
      );
    } else {
      launchTemplate.configurations[0].cwd = this.activeFolder;
    }

    const debugPath = path.join(
      this.activeFolder,
      `build/${this.buildMode}/out${this.buildMode}`,
    );
    if (this.settings.operatingSystem === OperatingSystems.windows) {
      launchTemplate.configurations[0].program = replaceBackslashes(debugPath);
    } else {
      launchTemplate.configurations[0].program = debugPath;
    }

    return launchTemplate;
  }
}
