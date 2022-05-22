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
import { Builds, Languages, OperatingSystems } from '../utils/types';
import { getProcessExecution } from '../utils/vscodeUtils';

const EXTENSION_NAME = 'C_Cpp_Runner';

export async function executeBuildTask(
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
    settingsProvider.useMsvc
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
    );
  } else {
    commandLine = executeBuildTaskUnixBased(
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

  const task = new vscode.Task(
    definition,
    vscode.TaskScope.Workspace,
    task_name,
    EXTENSION_NAME,
    execution,
  );

  await vscode.tasks.executeTask(task);
}

function executeBuildTaskUnixBased(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
  appendSymbol: string,
  executablePath: string,
) {
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

  let fullCompilerArgs = '';
  let fullLinkerArgs = '';

  if (warnings) {
    fullCompilerArgs += warnings;
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

  if (linkerArgs && linkerArgs.length > 0) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
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
    modeDir = modeDir.replace(activeFolder, '');

    let objectFilePath = path.join(modeDir, fileBaseName + '.o');
    if (!objectFilePath.startsWith('.')) {
      objectFilePath = '.' + objectFilePath;
    }

    objectFiles.push(objectFilePath);

    const hasSpace = file.includes(' ');
    let fullFileArgs;
    if (hasSpace) {
      fullFileArgs = `-c "${file}" -o "${objectFilePath}"`;
    } else {
      fullFileArgs = `-c ${file} -o ${objectFilePath}`;
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
    objectFilesStr += ` ${objectfile}`;
  }

  if (objectFilesStr === '') return;

  executablePath = executablePath.replace(activeFolder, '');
  if (!executablePath.startsWith('.')) {
    executablePath = '.' + executablePath;
  }

  const fullObjectFileArgs = `${objectFilesStr} -o ${executablePath}`;

  commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;

  if (fullLinkerArgs && fullLinkerArgs !== '') {
    commandLine += fullLinkerArgs;
  }

  commandLine = commandLine.replace('  ', ' ');

  return commandLine;
}

function executeBuildTaskMsvcBased(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
  appendSymbol: string,
  executablePath: string,
) {
  let compiler: string | undefined;
  let standard: string | undefined;

  if (language === Languages.cpp) {
    compiler = SettingsProvider.MSVC_COMPILER_NAME;
    standard = settingsProvider.cppStandard;
  } else {
    compiler = SettingsProvider.MSVC_COMPILER_NAME;
    standard = settingsProvider.cStandard;
  }

  const useWarnings = settingsProvider.enableWarnings;
  const warningsAsErrors = settingsProvider.warningsAsError;
  let warnings: string = '';
  if (useWarnings) {
    warnings = settingsProvider.warnings.join(' ');
  }
  if (useWarnings && warningsAsErrors) {
    warnings += ' -WX';
  }
  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  let fullCompilerArgs = '';

  if (useWarnings && warnings !== '') {
    fullCompilerArgs += warnings;
  }

  if (standard) {
    fullCompilerArgs += ` /std:${standard}`;
  }
  // Note: The c standard in msvc is either c11 or c17
  if (language === Languages.c) {
    // Deactivate secure function warnings in older c standards
    if (
      ['c89', 'c99', 'gnu89', 'gnu99'].some(
        (ext) => settingsProvider.cStandard === ext,
      )
    ) {
      fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
    }
  }

  if (buildMode === Builds.debug) {
    fullCompilerArgs += ' /Od /Zi';
  } else {
    fullCompilerArgs += ' /Ox /GL /DNDEBUG';
  }
  fullCompilerArgs += ' /EHsc';

  if (includePaths && includePaths.length > 0) {
    for (const includePath of includePaths) {
      const hasSpace = includePath.includes(' ');

      if (hasSpace) {
        fullCompilerArgs += ` /I"${includePath}"`;
      } else {
        fullCompilerArgs += ` /I${includePath}`;
      }
    }
  }

  let fullLinkerArgs: string = '';
  if (linkerArgs && linkerArgs.length > 0) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
  }
  fullCompilerArgs += fullLinkerArgs;

  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  let commandLine: string = `"${settingsProvider.msvcBatchPath}" ${settingsProvider.architecure} ${appendSymbol} `;

  modeDir = modeDir.replace(activeFolder, '.');
  executablePath = executablePath.replace(activeFolder, '.');
  const pathArgs = `/Fd${modeDir}\\ /Fo${modeDir}\\ /Fe${executablePath}`;

  let fullFileArgs: string = '';
  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    }

    const hasSpace = file.includes(' ');

    if (hasSpace) {
      fullFileArgs += ` .\\"${file}"`;
    } else {
      fullFileArgs += ` .\\${file}`;
    }
  }

  if (fullFileArgs === '') return;

  commandLine += ` cd ${activeFolder} &&`;
  commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullFileArgs}`;

  return commandLine;
}
