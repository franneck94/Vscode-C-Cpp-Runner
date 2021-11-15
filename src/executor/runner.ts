import * as path from 'path';
import * as vscode from 'vscode';

import { pathExists } from '../utils/fileUtils';
import { Builds, OperatingSystems, Task } from '../utils/types';

export async function executeRunTask(
  task: Task,
  activeFolder: string,
  buildMode: Builds,
  argumentsString: string | undefined,
  operatingSystem: OperatingSystems,
) {
  const modeDir = path.join('build', buildMode);

  if (!pathExists(path.join(activeFolder, modeDir))) return;

  let executableName: string;
  let executableRelativePath: string;

  if (operatingSystem === OperatingSystems.windows) {
    executableName = `out${buildMode}.exe`;
    executableRelativePath = path.join(modeDir, executableName);
  } else {
    executableName = `out${buildMode}`;
    executableRelativePath = `./${path.join(modeDir, executableName)}`;
  }

  let executableCall = `cd ${activeFolder} && ${executableRelativePath}`;

  if (!pathExists(path.join(activeFolder, executableRelativePath))) return;

  if (argumentsString) {
    executableCall += ` ${argumentsString}`;
  }

  if (task && task.execution) {
    task.execution.commandLine = executableCall;
    await vscode.tasks.executeTask(task);
  }
}
