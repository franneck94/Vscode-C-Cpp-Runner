import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import {
	filesInDir,
	getLanguage,
	isCppSourceFile,
	isCSourceFile,
	isSourceFile,
	mkdirRecursive,
	pathExists,
} from '../utils/fileUtils';
import { Builds, Languages, OperatingSystems, Task } from '../utils/types';

export async function executeBuildTask(
  task: Task,
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  singleFileBuild: boolean,
) {
  const appendSymbol = '&&';

  const language = getLanguage(activeFolder);

  let files: string[];
  if (!singleFileBuild) {
    files = filesInDir(activeFolder);
  } else {
    const currentFile = vscode.window.activeTextEditor?.document.fileName;
    if (!currentFile) return;

    const isSource = isSourceFile(path.extname(currentFile));
    if (!isSource) return;

    files = [path.basename(currentFile)];
  }

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

  let compiler: string | undefined;
  let standard: string | undefined;

  if (language === Languages.cpp) {
    compiler = settingsProvider.cppCompilerPath;
    standard = settingsProvider.cppStandard;
  } else {
    compiler = settingsProvider.cCompilerPath;
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
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  if (!includePaths.includes(activeFolder)) {
    includePaths.push(activeFolder);
  }

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
  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }
  if (linkerArgs && linkerArgs.length > 0) {
    fullCompilerArgs += ' ' + linkerArgs.join(' ');
  }
  if (includePaths && includePaths.length > 0) {
    for (const includePath of includePaths) {
      const hasSpace = includePath.includes(' ');

      if (hasSpace) {
        fullCompilerArgs += ` -I"${includePath}"`;
      } else {
        fullCompilerArgs += ` -I${includePath}`;
      }
    }
  }

  let commandLine: string = '';

  const objectFiles: string[] = [];

  let idx = -1;

  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    }

    idx++;

    const fileBaseName = path.parse(file).name;
    const filePath = path.join(activeFolder, file);
    const objectFilePath = path.join(modeDir, fileBaseName + '.o');

    objectFiles.push(objectFilePath);

    const hasSpace = filePath.includes(' ');
    let fullFileArgs;
    if (hasSpace) {
      fullFileArgs = `-c "${filePath}" -o "${objectFilePath}"`;
    } else {
      fullFileArgs = `-c ${filePath} -o ${objectFilePath}`;
    }

    if (idx === 0) {
      commandLine += `${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
    } else {
      commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
    }
  }

  // Exe task
  let objectFilesStr: string = '';
  for (const objectfile of objectFiles) {
    const hasSpace = objectfile.includes(' ');

    if (hasSpace) {
      objectFilesStr += ` "${objectfile}"`;
    } else {
      objectFilesStr += ` ${objectfile}`;
    }
  }

  if (objectFilesStr === '') return;

  const executablePathHasSpace = executablePath.includes(' ');
  let fullObjectFileArgs: string = '';
  if (executablePathHasSpace) {
    fullObjectFileArgs = `${objectFilesStr} -o "${executablePath}"`;
  } else {
    fullObjectFileArgs = `${objectFilesStr} -o ${executablePath}`;
  }

  if (!task || !task.execution) return;

  commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;

  task.execution.commandLine = commandLine;
  await vscode.tasks.executeTask(task);
}
