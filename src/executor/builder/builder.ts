import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../../provider/settingsProvider';
import { Builds, Languages, OperatingSystems } from '../../types/types';
import {
  getAllSourceFilesInDir,
  mkdirRecursive,
  pathExists,
} from '../../utils/fileUtils';
import { getProcessExecution } from '../../utils/vscodeUtils';
import { EXTENSION_NAME } from './params';
import {
  executeBuildTaskUnixBased,
  executeCudaBuildTask,
} from './unix/builder';
import { executeBuildTaskMsvcBased } from './win/builder';

export async function executeBuildTask(
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

  let executableName: string;
  if (operatingSystem === OperatingSystems.windows) {
    executableName = `out${buildMode}.exe`;
  } else {
    executableName = `out${buildMode}`;
  }

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
      appendSymbol,
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
      appendSymbol,
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
      appendSymbol,
      executablePath,
    );
  }

  if (!commandLine) return;

  const task_name = 'Build';

  const definition = {
    type: 'shell',
    task: task_name,
  };

  const execution = getProcessExecution(
    operatingSystem,
    settingsProvider.useMsvc,
    commandLine,
    activeFolder,
  );

  const problemMatcher =
    operatingSystem === OperatingSystems.windows && settingsProvider.useMsvc
      ? ['$msCompile']
      : ['$gcc'];

  const task = new vscode.Task(
    definition,
    vscode.TaskScope.Workspace,
    task_name,
    EXTENSION_NAME,
    execution,
    problemMatcher,
  );

  await vscode.tasks.executeTask(task);
}
