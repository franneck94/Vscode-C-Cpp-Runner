import * as path from 'path';

import { Builds, OperatingSystems } from '../types/enums';
import { pathExists } from '../utils/fileUtils';
import { runVscodeTask } from '../utils/vscodeUtils';

export async function executeRunTask(
  activeFolder: string,
  buildMode: Builds,
  argumentsString: string | undefined,
  operatingSystem: OperatingSystems,
) {
  const modeDir = path.join('build', buildMode);

  if (!pathExists(path.join(activeFolder, modeDir))) return;

  let executableName: string;
  let executablePath: string;

  if (operatingSystem === OperatingSystems.windows) {
    executableName = `out${buildMode}.exe`;
    executablePath = `.\\${path.join(modeDir, executableName)}`;
  } else {
    executableName = `out${buildMode}`;
    executablePath = `./${path.join(modeDir, executableName)}`;
  }

  let commandLine: string = '';
  const executablePathHasSpace = executablePath.includes(' ');

  if (executablePathHasSpace) {
    commandLine = `"${executablePath}"`;
  } else {
    commandLine = executablePath;
  }

  if (argumentsString) {
    commandLine += ` ${argumentsString.replace(/"/g, '')}`;
  }

  if (!commandLine) return;

  const task_name = 'Run';
  await runVscodeTask(task_name, commandLine, activeFolder, operatingSystem);
}
