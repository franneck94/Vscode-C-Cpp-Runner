import * as path from 'path';

import { SettingsProvider } from '../provider/settingsProvider';
import { Builds, OperatingSystems } from '../types/types';
import {
  getAllSourceFilesInDir,
  mkdirRecursive,
  pathExists,
} from '../utils/fileUtils';
import { runVscodeTask } from '../utils/vscodeUtils';
import { generateAssemblerUnixBased } from './builder/unix/builder';
import { generateAssemblerMsvcBased } from './builder/win/builder';

export async function generateAssemblerCode(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  singleFileBuild: boolean,
) {
  const appendSymbol = '&&';

  const { files: files, language: language } = getAllSourceFilesInDir(
    activeFolder,
    singleFileBuild,
  );

  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

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
      appendSymbol,
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
  await runVscodeTask(task_name, commandLine, activeFolder, operatingSystem);
}
