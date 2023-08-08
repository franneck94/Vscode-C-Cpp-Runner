import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import { gatherIncludeDirsUnix } from '../utils/compilerUtils';
import {
  getAllSourceFilesInDir,
  isCppSourceFile,
  isCSourceFile,
  isCudaSourceFile,
  mkdirRecursive,
  pathExists,
} from '../utils/fileUtils';
import { Builds, Languages, OperatingSystems } from '../utils/types';
import { getProcessExecution } from '../utils/vscodeUtils';

const EXTENSION_NAME = 'C_Cpp_Runner';

export async function generateAssemblerCode(
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

  let commandLine: string | undefined;
  if (
    operatingSystem === OperatingSystems.windows &&
    settingsProvider.useMsvc
  ) {
    commandLine = generateAssemblerMsvcBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
      appendSymbol,
    );
  } else {
    commandLine = generateAssemblerUnixBased(
      settingsProvider,
      activeFolder,
      buildMode,
      language,
      files,
      modeDir,
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

function generateAssemblerUnixBased(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
) {
  let compiler: string | undefined;
  let standard: string | undefined;

  if (language === Languages.cpp) {
    compiler = settingsProvider.cppCompilerPath.replace('.exe', '');
    standard = settingsProvider.cppStandard;
  } else {
    compiler = settingsProvider.cCompilerPath.replace('.exe', '');
    standard = settingsProvider.cStandard;
  }

  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;

  let fullCompilerArgs = '';

  if (standard) {
    fullCompilerArgs += ` --std=${standard}`;
  }
  if (buildMode === Builds.debug) {
    fullCompilerArgs += ' -g3 -O0';
  } else {
    fullCompilerArgs += ' -O3 -DNDEBUG';
  }
  if (compilerArgs && compilerArgs.length > 0 && !settingsProvider.useMsvc) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  fullCompilerArgs += gatherIncludeDirsUnix(includePaths);

  const assemblerFiles: string[] = [];
  const fullFileArgs: string[] = [];

  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cuda) {
      continue;
    }

    const hasSpace = file.includes(' ');
    const fileBaseName = path.parse(file).name.replace(' ', '');
    modeDir = modeDir.replace(activeFolder, '');

    let assemblerFilePath = path.join(modeDir, fileBaseName + '.s');
    if (!assemblerFilePath.startsWith('.')) {
      assemblerFilePath = '.' + assemblerFilePath;
    }

    let fullFileArg;
    if (hasSpace) {
      fullFileArg = `-S -o ${assemblerFilePath} '${file}'`;
    } else {
      fullFileArg = `-S -o ${assemblerFilePath} ${file}`;
    }

    assemblerFiles.push(assemblerFilePath);
    fullFileArgs.push(fullFileArg);
  }

  return ` ${compiler} ${fullCompilerArgs} ${fullFileArgs}`;
}

function generateAssemblerMsvcBased(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
  appendSymbol: string,
) {
  let compiler: string | undefined;
  let standard: string | undefined;
  let hadSpaces = false;

  if (language === Languages.cpp) {
    compiler = SettingsProvider.MSVC_COMPILER_NAME;
    standard = settingsProvider.cppStandard;
  } else {
    compiler = SettingsProvider.MSVC_COMPILER_NAME;
    standard = settingsProvider.cStandard;
  }

  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;

  let fullCompilerArgs = '';

  // Note: The c standard in msvc is either c11 or newer
  const old_standard = ['c89', 'c99', 'gnu89', 'gnu99'].some(
    (ext) => settingsProvider.cStandard === ext,
  );

  if (standard && (language === Languages.cpp || !old_standard)) {
    fullCompilerArgs += ` /std:${standard}`;
  }
  if (language === Languages.c) {
    if (old_standard) {
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
      if (includePath.includes('$(default)')) continue;

      const hasSpace = includePath.includes(' ');

      if (hasSpace) {
        fullCompilerArgs += ` /I"${includePath}"`;
      } else {
        fullCompilerArgs += ` /I${includePath}`;
      }
    }
  }

  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  let commandLine: string = `"${settingsProvider.msvcBatchPath}" ${settingsProvider.architecture} ${appendSymbol} `;

  modeDir = modeDir.replace(activeFolder, '.');
  const executablePath = activeFolder + 'main.exe';
  const pathArgs = `/Fa${modeDir}\\ /Fd${modeDir}\\ /Fo${modeDir}\\ /Fe${executablePath}`;

  const assemblerFiles: string[] = [];

  let fullFileArgs: string = '';
  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cuda) {
      continue;
    }

    assemblerFiles.push(file);

    const hasSpace = file.includes(' ');

    if (hasSpace) {
      fullFileArgs += ` "${file}"`;
      hadSpaces = true;
    } else {
      fullFileArgs += ` ${file}`;
    }
  }

  if (fullFileArgs === '') return;

  commandLine += ` cd ${activeFolder} &&`;
  commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullFileArgs}`;

  if (hadSpaces) {
    commandLine = `"${commandLine}"`;
  }

  return commandLine;
}
