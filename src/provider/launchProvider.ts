import * as path from "path";

import { FileProvider } from "./fileProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  JsonInterface,
  OperatingSystems,
  readJsonFile,
  writeJsonFile,
} from "../utils";

export class LaunchProvider extends FileProvider {
  constructor(
    public settings: SettingsProvider,
    public workspaceFolder: string,
    public pickedFolder: string,
    public templateFileName: string,
    public outputFileName: string
  ) {
    super(settings, workspaceFolder, templateFileName, outputFileName);

    if (!this.pickedFolder) {
      this.pickedFolder = this.workspaceFolder;
    }
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    const configJson: JsonInterface = readJsonFile(inputFilePath);

    if (!configJson) {
      return;
    }

    configJson.configurations[0].name = `Launch: Debug Program`;
    if (undefined !== this.settings.debugger) {
      configJson.configurations[0].MIMode = this.settings.debugger;
      configJson.configurations[0].miDebuggerPath = this.settings.debuggerPath;

      if (OperatingSystems.windows === this.settings.operatingSystem) {
        // XXX: Either gdb or the C/C++ extension has issues on windows with the internal terminal
        configJson.configurations[0].externalConsole = true;
      }
    }

    configJson.configurations[0].cwd = this.pickedFolder;
    const debugPath = path.join(this.pickedFolder, "build/Debug/outDebug");
    configJson.configurations[0].program = debugPath;

    writeJsonFile(outFilePath, configJson);
  }
}
