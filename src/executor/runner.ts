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
  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);
  if (!pathExists(modeDir)) return;

  let executableName: string;
  if (operatingSystem === OperatingSystems.windows) {
    executableName = `out${buildMode}.exe`;
  } else {
    executableName = `./out${buildMode}`;
  }

  let executableCall = path.join(modeDir, executableName);

  if (!pathExists(executableCall)) return;

  if (argumentsString) {
    executableCall += ` ${argumentsString}`;
  }

  if (task && task.execution) {
    task.execution.commandLine = executableCall;
    await vscode.tasks.executeTask(task);
  }
}
