import * as path from 'path';
import * as vscode from 'vscode';

import {
	pathExists,
	replaceBackslashes,
	rmdirRecursive,
} from '../utils/fileUtils';
import { Builds, OperatingSystems } from '../utils/types';
import { getProcessExecution } from '../utils/vscodeUtils';

const EXTENSION_NAME = 'C_Cpp_Runner';

export async function executeCleanTask(
  activeFolder: string,
  buildMode: Builds,
  workspaceFolder: string,
  operatingSystem: OperatingSystems,
) {
  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  let relativeModeDir = modeDir.replace(workspaceFolder, '');
  relativeModeDir = replaceBackslashes(relativeModeDir);

  const commandLine = `echo Cleaning ${relativeModeDir}...`;

  if (!pathExists(modeDir)) return;

  rmdirRecursive(modeDir);
  if (!commandLine) return;

  const task_name = 'Clean';

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
