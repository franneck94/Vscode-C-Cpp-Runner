import * as path from 'path';

import { LOWER_LIMIT_WILDARD_COMPILE } from '../../../params/params';
import { SettingsProvider } from '../../../provider/settingsProvider';
import { Builds, Languages } from '../../../types/enums';
import { isCppSourceFile, isCSourceFile } from '../../../utils/fileUtils';
import { GetWildcardPatterns, isNonMatchingSourceFile } from '../build_utils';
import { gatherIncludeDirsMsvc } from './msvc_utils';

export function executeBuildTaskMsvcBased(
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
    if (old_standard || settingsProvider.msvcSecureNoWarnings) {
      fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
    }
  } else if (
    language === Languages.cpp &&
    settingsProvider.msvcSecureNoWarnings
  ) {
    fullCompilerArgs += ' /D_CRT_SECURE_NO_WARNINGS';
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

  if (
    settingsProvider.useLinkTimeOptimization &&
    buildMode === Builds.release &&
    !singleFileBuild
  )
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

    if (isNonMatchingSourceFile(language, fileExtension)) continue;

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
    commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullLinkerArgs} `;

    if (language === Languages.cpp) {
      commandLine += GetWildcardPatterns(files);
    } else {
      commandLine += ' *.c';
    }
  } else {
    commandLine += ` cd ${activeFolder} &&`;
    commandLine += `${compiler} ${fullCompilerArgs} ${pathArgs} ${fullFileArgs} ${fullLinkerArgs}`;
  }

  if (hadSpaces) {
    commandLine = `"${commandLine}"`;
  }

  return commandLine;
}

export function generateAssemblerMsvcBased(
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
