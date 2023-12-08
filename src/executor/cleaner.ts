import { Builds, OperatingSystems } from '../types/enums';
import {
  getBuildModeDir,
  pathExists,
  replaceBackslashes,
  rmdirRecursive,
} from '../utils/fileUtils';
import { runVscodeTask } from '../utils/vscodeUtils';

export async function executeCleanTask(
  activeFolder: string,
  buildMode: Builds,
  workspaceFolder: string,
  operatingSystem: OperatingSystems,
) {
  const modeDir = getBuildModeDir(activeFolder, buildMode);

  let relativeModeDir = modeDir.replace(workspaceFolder, '');
  relativeModeDir = replaceBackslashes(relativeModeDir);

  const commandLine = `echo Cleaning ${modeDir.replace(
    workspaceFolder,
    '.',
  )} ...`;

  if (!pathExists(modeDir)) return;

  rmdirRecursive(modeDir);
  if (!commandLine) return;

  const task_name = 'Clean';
  await runVscodeTask(task_name, commandLine, activeFolder, operatingSystem);
}
