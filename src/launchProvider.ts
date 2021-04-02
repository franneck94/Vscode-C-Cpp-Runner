import { FileProvider } from "./fileProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  JsonInterface,
  OperatingSystems,
  readJsonFile,
  writeJsonFile,
} from "./utils";

export class LaunchProvider extends FileProvider {
  constructor(
    public settings: SettingsProvider,
    public workspacePath: string,
    public templateFileName: string,
    public outputFileName: string
  ) {
    super(settings, workspacePath, templateFileName, outputFileName);
  }

  public writeFileData(inputFilePath: string, outFilePath: string) {
    const configJson: JsonInterface = readJsonFile(inputFilePath);

    if (undefined === configJson) {
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

    writeJsonFile(outFilePath, configJson);
  }
}
