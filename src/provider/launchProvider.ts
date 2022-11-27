import * as path from 'path';

import {
	getOccurenceIndicies,
	pathExists,
	readJsonFile,
	replaceBackslashes,
	writeJsonFile,
} from '../utils/fileUtils';
import {
	Builds,
	Debuggers,
	JsonLaunchConfig,
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

    if (updateRequired && activeFolder) {
      this.createFileData();
    }
  }

  protected updateCheck() {
    if (!pathExists(this._outputPath)) {
      return true;
    } else {
      const configJson: JsonLaunchConfig = readJsonFile(this._outputPath);

      if (configJson) {
        configJson.configurations.forEach((config) => {
          const triplet: string = config.name;
          if (triplet.includes(this.settings.operatingSystem)) {
            return true;
          }
        });
      }
    }

    return false;
  }

  public writeFileData() {
    if (!this.workspaceFolder && !this.activeFolder) return;

    if (!this.activeFolder) {
      this.activeFolder = this.workspaceFolder;
    }

    if (!this.templatePath) return;

    const launchTemplate: JsonLaunchConfig | undefined = readJsonFile(
      this.templatePath,
    );

    if (!launchTemplate) return;

    if (
      this.settings.operatingSystem === OperatingSystems.windows &&
      (this.settings.useMsvc || this.settings.cCompilerPath.includes('clang'))
    ) {
      this.msvcBasedDebugger(launchTemplate);
      delete launchTemplate.configurations[0]?.externalConsole;
    } else if (
      this.settings.operatingSystem === OperatingSystems.windows &&
      launchTemplate.configurations[0]
    ) {
      this.unixBasedDebugger(launchTemplate);
      delete launchTemplate.configurations[0]?.console;
      launchTemplate.configurations[0].externalConsole = true;
    } else {
      this.unixBasedDebugger(launchTemplate);
      delete launchTemplate.configurations[0]?.console;
    }

    const launchLocal: JsonLaunchConfig | undefined = readJsonFile(
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

    if (!launchTemplate.configurations[0]) return;

    if (launchLocal && launchLocal.configurations.length === configIdx) {
      launchLocal.configurations.push(launchTemplate.configurations[0]);
    } else {
      if (!launchLocal.configurations[configIdx]) return;

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
    const launchLocal: JsonLaunchConfig | undefined = readJsonFile(
      this._outputPath,
    );

    if (!launchLocal) return;

    const configIdx = getLaunchConfigIndex(launchLocal, CONFIG_NAME);

    if (configIdx !== undefined) {
      const currentConfig = launchLocal.configurations[configIdx];

      if (currentConfig === undefined) return;

      if (
        currentConfig.miDebuggerPath !== this.settings.debuggerPath &&
        currentConfig.miDebuggerPath
      ) {
        this.settings.debuggerPath = currentConfig.miDebuggerPath;

        if (
          currentConfig.miDebuggerPath.includes(Debuggers.gdb) ||
          currentConfig.miDebuggerPath.includes(Debuggers.lldb)
        ) {
          this.settings.debuggerPath = currentConfig.miDebuggerPath;
        }
      }
    } else {
      this.writeFileData();
    }
  }

  private msvcBasedDebugger(launchTemplate: JsonLaunchConfig) {
    if (launchTemplate.configurations[0] === undefined) return;

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

  private unixBasedDebugger(launchTemplate: JsonLaunchConfig) {
    if (launchTemplate.configurations[0] === undefined) return;

    launchTemplate.configurations[0].name = CONFIG_NAME;
    if (this.settings.debuggerPath) {
      launchTemplate.configurations[0].MIMode =
        this.settings.debuggerPath.includes(Debuggers.gdb)
          ? Debuggers.gdb
          : Debuggers.lldb;
      launchTemplate.configurations[0].miDebuggerPath =
        this.settings.debuggerPath;
    } else {
      launchTemplate.configurations[0].MIMode =
        SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC;
      launchTemplate.configurations[0].miDebuggerPath =
        SettingsProvider.DEFAULT_DEBUGGER_PATH_NON_MAC;
    }

    if (
      OperatingSystems.mac === this.settings.operatingSystem &&
      (this.settings.cCompilerPath.includes('clang') ||
        this.settings.cppCompilerPath.includes('clang++')) &&
      this.settings.debuggerPath.includes('lldb')
    ) {
      launchTemplate.configurations[0].type = 'lldb';

      delete launchTemplate.configurations[0]?.setupCommands;
      delete launchTemplate.configurations[0]?.miDebuggerPath;
      delete launchTemplate.configurations[0]?.MIMode;
      delete launchTemplate.configurations[0]?.stopAtEntry;
      delete launchTemplate.configurations[0]?.externalConsole;
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
