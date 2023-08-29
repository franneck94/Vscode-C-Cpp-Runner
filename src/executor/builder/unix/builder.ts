import * as path from 'path';

import { SettingsProvider } from '../../../provider/settingsProvider';
import { Builds, Languages, OperatingSystems } from '../../../types/types';
import { LOWER_LIMIT_WILDARD_COMPILE } from '../params';
import {
  gatherIncludeDirsUnix,
  getFileArgs,
  GetWildcardPatterns,
  isNonMatchingSourceFile,
} from '../utils';
import { getUnixObjectFilesStr, mergeUnixCompileFilesStr } from './utils';

export function executeBuildTaskUnixBased(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
  appendSymbol: string,
  executablePath: string,
  singleFileBuild: boolean,
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
  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  fullCompilerArgs += gatherIncludeDirsUnix(includePaths);

  if (linkerArgs && linkerArgs.length > 0) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
  }

  let commandLine: string = '';

  const objectFiles: string[] = [];
  const fullFileArgs: string[] = [];

  const useLto =
    settingsProvider.useLinkTimeOptimization &&
    buildMode === Builds.release &&
    !singleFileBuild;
  const ltoFlag = useLto ? '-flto' : '';

  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (isNonMatchingSourceFile(language, fileExtension)) continue;

    const fileBaseName = path.parse(file).name.replace(' ', '');
    modeDir = modeDir.replace(activeFolder, '');

    let objectFilePath = path.join(modeDir, fileBaseName + '.o');
    if (!objectFilePath.startsWith('.')) {
      objectFilePath = '.' + objectFilePath;
    }

    const fullFileArg = getFileArgs(file, ltoFlag, objectFilePath);

    objectFiles.push(objectFilePath);
    fullFileArgs.push(fullFileArg);
  }

  commandLine += mergeUnixCompileFilesStr(
    objectFiles,
    fullFileArgs,
    compiler,
    fullCompilerArgs,
    appendSymbol,
  );

  const objectFilesStr = getUnixObjectFilesStr(objectFiles);
  if (objectFilesStr === '') return;

  executablePath = executablePath.replace(activeFolder, '');
  if (!executablePath.startsWith('.')) {
    executablePath = '.' + executablePath;
  }

  if (objectFiles.length >= LOWER_LIMIT_WILDARD_COMPILE) {
    commandLine += `${compiler} ${fullCompilerArgs}`;

    if (language === Languages.cpp) {
      commandLine += GetWildcardPatterns(files);
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

export function executeCudaBuildTask(
  settingsProvider: SettingsProvider,
  activeFolder: string,
  buildMode: Builds,
  language: Languages,
  files: string[],
  modeDir: string,
  appendSymbol: string,
  executablePath: string,
) {
  const compiler = 'nvcc';
  const standard =
    settingsProvider.cppStandard !== '' ? settingsProvider.cppStandard : '';

  const includePaths = settingsProvider.includePaths;
  const compilerArgs = settingsProvider.compilerArgs;
  const linkerArgs = settingsProvider.linkerArgs;

  let fullCompilerArgs = '';
  let fullLinkerArgs = '';

  const showCompilationTime = settingsProvider.showCompilationTime;
  if (showCompilationTime) {
    fullCompilerArgs += ' --time -';
  }

  if (standard) {
    fullCompilerArgs += ` --std=${standard}`;
  }
  if (buildMode === Builds.debug) {
    fullCompilerArgs += ' -g -O0';
  } else {
    fullCompilerArgs += ' -O3';
  }
  if (compilerArgs && compilerArgs.length > 0) {
    fullCompilerArgs += ' ' + compilerArgs.join(' ');
  }

  fullCompilerArgs += gatherIncludeDirsUnix(includePaths);

  if (linkerArgs && linkerArgs.length > 0) {
    fullLinkerArgs += ' ' + linkerArgs.join(' ');
  }

  let commandLine: string = '';

  const objectFiles: string[] = [];
  const fullFileArgs: string[] = [];

  const useLto =
    settingsProvider.useLinkTimeOptimization && buildMode === Builds.release;
  const ltoFlag = useLto ? '--lto' : '';
  const operatingSystem = settingsProvider.operatingSystem;

  for (const file of files) {
    const fileExtension = path.parse(file).ext;

    if (isNonMatchingSourceFile(language, fileExtension)) continue;

    const fileBaseName = path.parse(file).name.replace(' ', '');
    modeDir = modeDir.replace(activeFolder, '');

    let objectFilePath: string;
    if (operatingSystem === OperatingSystems.windows) {
      objectFilePath = path.join(modeDir, fileBaseName + '.obj');
    } else {
      objectFilePath = path.join(modeDir, fileBaseName + '.o');
    }
    if (!objectFilePath.startsWith('.')) {
      objectFilePath = '.' + objectFilePath;
    }

    const fullFileArg = getFileArgs(file, ltoFlag, objectFilePath);

    objectFiles.push(objectFilePath);
    fullFileArgs.push(fullFileArg);
  }

  commandLine += mergeUnixCompileFilesStr(
    objectFiles,
    fullFileArgs,
    compiler,
    fullCompilerArgs,
    appendSymbol,
  );

  const objectFilesStr = getUnixObjectFilesStr(objectFiles);
  if (objectFilesStr === '') return;

  executablePath = executablePath.replace(activeFolder, '');
  if (!executablePath.startsWith('.')) {
    executablePath = '.' + executablePath;
  }

  if (objectFiles.length >= LOWER_LIMIT_WILDARD_COMPILE) {
    commandLine += `${compiler} ${fullCompilerArgs}`;

    if (language === Languages.cpp) {
      commandLine += GetWildcardPatterns(files);
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
