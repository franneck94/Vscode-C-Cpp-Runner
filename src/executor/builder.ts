import * as path from 'path';

import { APPEND_SYMBOL } from '../params/params';
import { SettingsProvider } from '../provider/settingsProvider';
import { Builds, Languages, OperatingSystems } from '../types/enums';
import {
  getAllSourceFilesInDir,
  getBuildModeDir,
  mkdirRecursive,
  pathExists,
} from '../utils/fileUtils';
import { runVscodeTask } from '../utils/vscodeUtils';
import { executeCudaBuildTask } from './builder/unix/cuda';
import { executeBuildTaskUnixBased } from './builder/unix/gcc_clang';
import { executeBuildTaskMsvcBased } from './builder/win/msvc';

export function getExecutableName(
  operatingSystem: OperatingSystems,
  buildMode: Builds,
) {
  if (operatingSystem === OperatingSystems.windows)
    return `out${buildMode}.exe`;

  return `out${buildMode}`;
}

export async function executeBuildTask(
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

  const executableName = getExecutableName(operatingSystem, buildMode);
  const executablePath = path.join(modeDir, executableName);

  let commandLine: string | undefined;
  if (
    operatingSystem === OperatingSystems.windows &&
    settingsProvider.useMsvc &&
    language !== Languages.cuda
  ) {
    commandLine = executeBuildTaskMsvcBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
      APPEND_SYMBOL,
      executablePath,
      singleFileBuild,
    );
  } else if (language !== Languages.cuda) {
    commandLine = executeBuildTaskUnixBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
      APPEND_SYMBOL,
      executablePath,
      singleFileBuild,
    );
  } else {
    commandLine = executeCudaBuildTask(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
      APPEND_SYMBOL,
      executablePath,
    );
  }

  if (!commandLine) return;

  const problemMatcher =
    operatingSystem === OperatingSystems.windows && settingsProvider.useMsvc
      ? ['$msCompile']
      : ['$gcc'];

  const task_name = 'Build';

  await runVscodeTask(
    task_name,
    commandLine,
    activeFolder,
    operatingSystem,
    problemMatcher,
    settingsProvider.useMsvc,
  );
}
