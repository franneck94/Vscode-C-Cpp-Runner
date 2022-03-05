import * as path from 'path';
import * as vscode from 'vscode';

import { pathExists } from '../utils/fileUtils';
import { Builds, OperatingSystems } from '../utils/types';
import { getProcessExecution } from '../utils/vscodeUtils';

const EXTENSION_NAME = 'C_Cpp_Runner';

export async function executeRunTask(
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

  if (!pathExists(path.join(activeFolder, executableRelativePath))) return;

  let commandLine: string = '';
  const activeFolderHasSpace = activeFolder.includes(' ');
  const executableRelativePathHasSpace = executableRelativePath.includes(' ');

  if (activeFolderHasSpace || executableRelativePathHasSpace) {
    commandLine = `cd "${activeFolder}" && "${executableRelativePath}"`;
  } else {
    commandLine = `cd ${activeFolder} && ${executableRelativePath}`;
  }

  if (argumentsString) {
    commandLine += ` ${argumentsString}`;
  }

  if (!commandLine) return;

  const task_name = 'Run';

  const execution = getProcessExecution(
    operatingSystem,
    commandLine,
    activeFolder,
  );

  const definition = {
    type: 'shell',
    task: task_name,
  };

  const task = new vscode.Task(
    definition,
    vscode.TaskScope.Workspace,
    task_name,
    EXTENSION_NAME,
    execution,
  );

  await vscode.tasks.executeTask(task);
}
