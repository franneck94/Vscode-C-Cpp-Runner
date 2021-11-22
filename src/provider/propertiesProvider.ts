import {
	getBasename,
	pathExists,
	readJsonFile,
	removeExtension,
	writeJsonFile,
} from '../utils/fileUtils';
import { Compilers, JsonConfiguration, OperatingSystems } from '../utils/types';
import { FileProvider } from './fileProvider';
import { SettingsProvider } from './settingsProvider';

const TEMPLATE_FILENAME = 'properties_template.json';
const OUTPUT_FILENAME = 'c_cpp_properties.json';
const INCLUDE_PATTERN = '${workspaceFolder}/**';

export class PropertiesProvider extends FileProvider {
  constructor(
    protected settings: SettingsProvider,
    public workspaceFolder: string,
    public activeFolder: string | undefined,
  ) {
    super(workspaceFolder, TEMPLATE_FILENAME, OUTPUT_FILENAME);

    const updateRequired = this.updateCheck();

    if (updateRequired && activeFolder) {
      this.createFileData();
    }
  }

  protected updateCheck() {
    let doUpdate = false;

    if (!pathExists(this._outputPath)) {
      doUpdate = true;
    } else {
      const configLocal: JsonConfiguration = readJsonFile(this._outputPath);
      if (configLocal) {
        const triplet: string = configLocal.configurations[0].name;

        if (!triplet.includes(this.settings.operatingSystem)) {
          doUpdate = true;
        }
      }
    }

    return doUpdate;
  }

  public writeFileData() {
    let configLocal: JsonConfiguration | undefined;

    if (!pathExists(this._outputPath)) {
      configLocal = readJsonFile(this.templatePath);
    } else {
      configLocal = readJsonFile(this._outputPath);
    }

    if (!configLocal) return;

    if (!this.settings.cCompiler) return;
    if (!this.settings.architecure) return;

    const triplet =
      `${this.settings.operatingSystem.toLowerCase()}-` +
      `${this.settings.cCompiler.toLowerCase()}-` +
      `${this.settings.architecure.toLowerCase()}`;

    const currentConfig = configLocal.configurations[0];
    currentConfig.compilerArgs = [];

    if (this.settings.warnings) {
      for (const warning of this.settings.warnings) {
        const compilerArgsSet = new Set(currentConfig.compilerArgs);
        if (!compilerArgsSet.has(warning)) {
          currentConfig.compilerArgs.push(warning);
        }
      }
    }

    if (this.settings.compilerArgs) {
      for (const arg of this.settings.compilerArgs) {
        const compilerArgsSet = new Set(currentConfig.compilerArgs);
        if (!compilerArgsSet.has(arg)) {
          currentConfig.compilerArgs.push(arg);
        }
      }
    }

    if (this.settings.includePaths) {
      currentConfig.includePath = [INCLUDE_PATTERN];
      for (const path of this.settings.includePaths) {
        const includePathSet = new Set(currentConfig.includePath);
        if (path !== INCLUDE_PATTERN && !includePathSet.has(path)) {
          currentConfig.includePath.push(path);
        }
      }
    } else {
      currentConfig.includePath = [INCLUDE_PATTERN];
    }

    if (this.settings.cStandard) {
      currentConfig.cStandard = this.settings.cStandard;
    } else {
      currentConfig.cStandard = '${default}';
    }

    if (this.settings.cppStandard) {
      currentConfig.cppStandard = this.settings.cppStandard;
    } else {
      currentConfig.cppStandard = '${default}';
    }

    currentConfig.compilerPath = this.settings.cCompilerPath;

    // Since C/C++ Extension Version 1.4.0 cygwin is a linux triplet
    if (
      this.settings.isCygwin &&
      this.settings.operatingSystem === OperatingSystems.windows
    ) {
      currentConfig.name = triplet.replace('windows', 'windows-cygwin');
      currentConfig.intelliSenseMode = triplet.replace('windows', 'linux');
    } else {
      currentConfig.name = triplet;
      currentConfig.intelliSenseMode = triplet;
    }

    writeJsonFile(this._outputPath, configLocal);
  }

  public updateFolderData(workspaceFolder: string) {
    super._updateFolderData(workspaceFolder);
  }

  public changeCallback() {
    const configLocal: JsonConfiguration | undefined = readJsonFile(
      this._outputPath,
    );

    if (!configLocal) return;

    const currentConfig = configLocal.configurations[0];

    if (
      currentConfig.compilerPath !== this.settings.cCompilerPath &&
      currentConfig.compilerPath !== this.settings.cppCompilerPath
    ) {
      let compilerName = currentConfig.compilerPath;
      this.settings.cCompilerPath = currentConfig.compilerPath;

      compilerName = getBasename(compilerName);
      compilerName = removeExtension(compilerName, 'exe');

      if (compilerName.includes(Compilers.clang)) {
        this.settings.setClang(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.clangpp)) {
        this.settings.setClangpp(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.gcc)) {
        this.settings.setGcc(currentConfig.compilerPath);
      } else if (compilerName.includes(Compilers.gpp)) {
        this.settings.setGpp(currentConfig.compilerPath);
      }
    }

    if (
      currentConfig.cStandard !== '${default}' &&
      currentConfig.cStandard !== this.settings.cStandard
    ) {
      this.settings.cStandard = currentConfig.cStandard;
      this.settings.update('cStandard', currentConfig.cStandard);
    }

    if (
      currentConfig.cppStandard !== '${default}' &&
      currentConfig.cppStandard !== this.settings.cppStandard
    ) {
      this.settings.cppStandard = currentConfig.cppStandard;
      this.settings.update('cppStandard', currentConfig.cppStandard);
    }

    const argsSet: Set<string> = new Set(currentConfig.compilerArgs);
    const args: string[] = [...argsSet];
    const warningArgs = args.filter((arg: string) => arg.includes('-W'));
    const compilerArgs = args.filter((arg: string) => !arg.includes('-W'));
    const includeArgs = currentConfig.includePath.filter(
      (path: string) => path !== INCLUDE_PATTERN,
    );

    this.settings.warnings = warningArgs;
    this.settings.compilerArgs = compilerArgs;
    this.settings.includePaths = includeArgs;

    this.settings.setOtherSettings();
  }
}
