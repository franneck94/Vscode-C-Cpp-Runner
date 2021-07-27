import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import {
	filesInDir,
	getLanguage,
	isCppSourceFile,
	isCSourceFile,
	mkdirRecursive,
	pathExists,
} from '../utils/fileUtils';
import {
	Builds,
	Compilers,
	Languages,
	OperatingSystems,
	Task,
} from '../utils/types';

export async function executeBuildTask(
  task: Task,
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
) {
  const language = getLanguage(activeFolder);

  const files = filesInDir(activeFolder);
  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  if (!pathExists(modeDir)) {
    mkdirRecursive(modeDir);
  }

  let executableName: string;
  if (settingsProvider.operatingSystem === OperatingSystems.windows) {
    executableName = `out${buildMode}.exe`;
  } else {
    executableName = `out${buildMode}`;
  }

  const executablePath = path.join(modeDir, executableName);

  let compiler: string | Compilers | undefined;
  let standard: string | undefined;

  if (language === Languages.cpp) {
    compiler = settingsProvider.cppCompiler;
    standard = settingsProvider.cppStandard;
  } else {
    compiler = settingsProvider.cCompiler;
    standard = settingsProvider.cStandard;
  }

  const useWarnings = settingsProvider.enableWarnings;
  const warningsAsErrors = settingsProvider.warningsAsError;
  let warnings: string = '';
  if (useWarnings) {
    warnings = settingsProvider.warnings.join(' ');
  }
  if (useWarnings && warningsAsErrors) {
    warnings += ' -Werror';
  }
  const includePaths = settingsProvider.includePaths;
  const includes = includePaths.join(' -I ');
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  let fullCompilerArgs = '';
  if (warnings) {
    fullCompilerArgs += `${warnings}`;
  }
  if (standard) {
    fullCompilerArgs += ` --std=${standard}`;
  }
  if (buildMode === Builds.debug) {
    fullCompilerArgs += ' -g3 -O0';
  } else {
    fullCompilerArgs += ' -O3 -DNDEBUG';
  }
  if (compilerArgs) {
    fullCompilerArgs += compilerArgs;
  }
  if (linkerArgs) {
    fullCompilerArgs += linkerArgs;
  }
  if (includes) {
    fullCompilerArgs += includes;
  }

  let commandLine: string = '';
  const objectFiles: string[] = [];

  for (const file of files) {
    const fileExtension = path.parse(file).ext;
    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    }

    const fileBaseName = path.parse(file).name;
    const filePath = path.join(activeFolder, file);
    const objectFilePath = path.join(modeDir, fileBaseName + '.o');

    objectFiles.push(objectFilePath);

    const fullFileArgs = `-c ${filePath} -o ${objectFilePath}`;

    if (commandLine.length === 0) {
      commandLine += `${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
    } else {
      commandLine += ` && ${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
    }
  }

  // Exe task
  const objectFilesStr = objectFiles.join(' ');
  const fullObjectFileArgs = `${objectFilesStr} -o ${executablePath}`;
  if (task && task.execution) {
    commandLine += ` && ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;
    task.execution.commandLine = commandLine;
    await vscode.tasks.executeTask(task);
  }
}