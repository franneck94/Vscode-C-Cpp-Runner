import * as vscode from 'vscode';

import { EXTENSION_NAME } from '../params/params';
import { OperatingSystems } from '../types/types';
import { getProcessExecution } from '../utils/vscodeUtils';

export async function runVscodeTask(
  task_name: string,
  commandLine: string,
  activeFolder: string,
  operatingSystem: OperatingSystems,
) {
  const execution = getProcessExecution(
    operatingSystem,
    false,
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
