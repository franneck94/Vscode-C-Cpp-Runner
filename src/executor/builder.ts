import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import {
  gatherIncludeDirsMsvc,
  gatherIncludeDirsUnix,
} from '../utils/compilerUtils';
import {
  getAllSourceFilesInDir,
  isCppSourceFile,
  isCSourceFile,
  mkdirRecursive,
  pathExists,
} from '../utils/fileUtils';
import { Builds, Languages, OperatingSystems } from '../utils/types';
import { getProcessExecution } from '../utils/vscodeUtils';

const EXTENSION_NAME = 'C_Cpp_Runner';

const LOWER_LIMIT_WILDARD_COMPILE = 7;

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
    compiler = settingsProvider.cppCompilerPath.replace('.exe', '');
    standard = settingsProvider.cppStandard;
  } else {
    compiler = settingsProvider.cCompilerPath.replace('.exe', '');
    standard = settingsProvider.cStandard;
  }

  const useWarnings = settingsProvider.enableWarnings;
  const warningsAsErrors = settingsProvider.warningsAsError;

  let warnings: string = '';
  if (useWarnings) {
    warnings = settingsProvider.warnings.join(' ');
  }
  if (warningsAsErrors) {
    warnings += ' -Werror';
  }
  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  let fullCompilerArgs = warnings;
  let fullLinkerArgs = '';

  const useAddressSanitizer = settingsProvider.useAddressSanitizer;
  if (useAddressSanitizer && buildMode === Builds.debug) {
    fullCompilerArgs += ' -fsanitize=address';
  }
  const useUndefinedSanitizer = settingsProvider.useUndefinedSanitizer;
  if (useUndefinedSanitizer && buildMode === Builds.debug) {
    fullCompilerArgs += ' -fsanitize=undefined';
  }
  const useLeakSanitizer = settingsProvider.useLeakSanitizer;
  if (useLeakSanitizer && buildMode === Builds.debug) {
    fullCompilerArgs += ' -fsanitize=leak';
  }

  const showCompilationTime = settingsProvider.showCompilationTime;
  if (showCompilationTime) {
    fullCompilerArgs += ' -ftime-report';
  }

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

  if (linkerArgs && linkerArgs.length > 0 && !settingsProvider.useMsvc) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
  }

  let commandLine: string = '';

  const objectFiles: string[] = [];
  const fullFileArgs: string[] = [];

  const useLto =
    settingsProvider.useLinkTimeOptimization && buildMode === Builds.release;
  const ltoFlag = useLto ? '-flto' : '';

  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    }

    const hasSpace = file.includes(' ');
    const fileBaseName = path.parse(file).name.replace(' ', '');
    modeDir = modeDir.replace(activeFolder, '');

    let objectFilePath = path.join(modeDir, fileBaseName + '.o');
    if (!objectFilePath.startsWith('.')) {
      objectFilePath = '.' + objectFilePath;
    }

    let fullFileArg;
    if (hasSpace) {
      fullFileArg = `${ltoFlag} -c '${file}' -o '${objectFilePath}'`;
    } else {
      fullFileArg = `${ltoFlag} -c ${file} -o ${objectFilePath}`;
    }

    objectFiles.push(objectFilePath);
    fullFileArgs.push(fullFileArg);
  }

  let idx = 0;
  if (objectFiles.length < LOWER_LIMIT_WILDARD_COMPILE) {
    for (const fullFileArg of fullFileArgs) {
      if (idx === 0) {
        commandLine += `${compiler} ${fullCompilerArgs} ${fullFileArg}`;
      } else {
        commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullFileArg}`;
      }
      idx++;
    }
  }

  // Exe task
  let objectFilesStr: string = '';
  for (const objectfile of objectFiles) {
    if (objectfile.includes(' ')) objectFilesStr += ` "${objectfile}"`;
    else objectFilesStr += ` ${objectfile}`;
  }

  if (objectFilesStr === '') return;

  executablePath = executablePath.replace(activeFolder, '');
  if (!executablePath.startsWith('.')) {
    executablePath = '.' + executablePath;
  }

  if (objectFiles.length >= LOWER_LIMIT_WILDARD_COMPILE) {
    commandLine += `${compiler} ${fullCompilerArgs}`;

    if (language === Languages.cpp) {
      const has_cpp = files.some((f: string) => f.endsWith('.cpp'));
      const has_cc = files.some((f: string) => f.endsWith('.cc'));
      const has_cxx = files.some((f: string) => f.endsWith('.cxx'));

      if (has_cpp && !has_cc && !has_cxx) commandLine += ' *.cpp';
      if (!has_cpp && has_cc && !has_cxx) commandLine += ' *.cc';
      if (!has_cpp && !has_cc && has_cxx) commandLine += ' *.cxx';

      if (!has_cpp && has_cc && has_cxx) commandLine += ' *.cc *.cxx';
      if (has_cpp && !has_cc && has_cxx) commandLine += ' *.cpp *.cxx';
      if (has_cpp && has_cc && !has_cxx) commandLine += ' *.cpp *.cc';

      if (has_cpp && has_cc && has_cxx) commandLine += ' *.cpp *.cc *.cxx';
    } else {
      commandLine += ' *.c';
    }

    commandLine += ` -o ${executablePath}`;
  }

  if (objectFiles.length < LOWER_LIMIT_WILDARD_COMPILE) {
    const fullObjectFileArgs = `${ltoFlag} ${objectFilesStr} -o ${executablePath}`;
    commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullObjectFileArgs}`;
  }

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
  let hadSpaces = false;

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
    warnings = settingsProvider.msvcWarnings.join(' ');
  }
  if (warningsAsErrors) {
    warnings += ' /WX';
  }
  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  let fullCompilerArgs = warnings;

  const useAddressSanitizer = settingsProvider.useAddressSanitizer;
  if (useAddressSanitizer && buildMode === Builds.debug) {
    fullCompilerArgs += ' /fsanitize=address';
  }

  const showCompilationTime = settingsProvider.showCompilationTime;
  if (showCompilationTime) {
    fullCompilerArgs += ' /Bt /d2cgsummary';
  }

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

  fullCompilerArgs += gatherIncludeDirsMsvc(includePaths);

  let fullLinkerArgs: string = '';

  if (linkerArgs && linkerArgs.length > 0) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
  }

  if (fullLinkerArgs.length > 0) fullLinkerArgs = ' /link ' + fullLinkerArgs;

  if (settingsProvider.useLinkTimeOptimization && buildMode === Builds.release)
    fullLinkerArgs += ' /LTCG';

  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  let commandLine: string = `"${settingsProvider.msvcBatchPath}" ${settingsProvider.architecture} ${appendSymbol} `;

  modeDir = modeDir.replace(activeFolder, '.');
  executablePath = executablePath.replace(activeFolder, '.');
  const pathArgs = `/Fd${modeDir}\\ /Fo${modeDir}\\ /Fe${executablePath}`;

  const objectFiles: string[] = [];

  let fullFileArgs: string = '';
  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (language === Languages.c && !isCSourceFile(fileExtension)) {
      continue;
    } else if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
      continue;
    }

    objectFiles.push(file);

    const hasSpace = file.includes(' ');

    if (hasSpace) {
      fullFileArgs += ` "${file}"`;
      hadSpaces = true;
    } else {
      fullFileArgs += ` ${file}`;
    }
  }

  if (fullFileArgs === '') return;

  if (objectFiles.length >= LOWER_LIMIT_WILDARD_COMPILE) {
    commandLine += ` cd ${activeFolder} &&`;
    commandLine += `${compiler} ${fullCompilerArgs} ${fullLinkerArgs} ${pathArgs}`;

    if (language === Languages.cpp) {
      const has_cpp = files.some((f: string) => f.endsWith('.cpp'));
      const has_cc = files.some((f: string) => f.endsWith('.cc'));
      const has_cxx = files.some((f: string) => f.endsWith('.cxx'));

      if (has_cpp && !has_cc && !has_cxx) commandLine += ' *.cpp';
      if (!has_cpp && has_cc && !has_cxx) commandLine += ' *.cc';
      if (!has_cpp && !has_cc && has_cxx) commandLine += ' *.cxx';

      if (!has_cpp && has_cc && has_cxx) commandLine += ' *.cc *.cxx';
      if (has_cpp && !has_cc && has_cxx) commandLine += ' *.cpp *.cxx';
      if (has_cpp && has_cc && !has_cxx) commandLine += ' *.cpp *.cc';

      if (has_cpp && has_cc && has_cxx) commandLine += ' *.cpp *.cc *.cxx';
    } else {
      commandLine += ' *.c';
    }
  } else {
    commandLine += ` cd ${activeFolder} &&`;
    commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullLinkerArgs} ${fullFileArgs}`;
  }

  if (hadSpaces) {
    commandLine = `"${commandLine}"`;
  }

  return commandLine;
}
