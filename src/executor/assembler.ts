import { APPEND_SYMBOL } from '../params/params';
import { SettingsProvider } from '../provider/settingsProvider';
import { Builds, OperatingSystems } from '../types/enums';
import {
  getAllSourceFilesInDir,
  getBuildModeDir,
  mkdirRecursive,
  pathExists,
} from '../utils/fileUtils';
import { runVscodeTask } from '../utils/vscodeUtils';
import { generateAssemblerUnixBased } from './builder/unix/cuda';
import { generateAssemblerMsvcBased } from './builder/win/msvc';

export async function generateAssemblerCode(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  singleFileBuild: boolean,
) {
  const { files: files, language: language } = getAllSourceFilesInDir(
    activeFolder,
    singleFileBuild,
  );

  const modeDir = getBuildModeDir(activeFolder, buildMode);

  if (!pathExists(modeDir)) {
    mkdirRecursive(modeDir);
  }

  const operatingSystem = settingsProvider.operatingSystem;

  let commandLine: string | undefined;
  if (
    operatingSystem === OperatingSystems.windows &&
    settingsProvider.useMsvc
  ) {
    commandLine = generateAssemblerMsvcBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
      APPEND_SYMBOL,
    );
  } else {
    commandLine = generateAssemblerUnixBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
    );
  }

  if (!commandLine) return;

  const task_name = 'Build';
  await runVscodeTask(
    task_name,
    commandLine,
    activeFolder,
    operatingSystem,
    undefined,
    settingsProvider.useMsvc,
  );

  // TODO open that assembler file to the side
}
