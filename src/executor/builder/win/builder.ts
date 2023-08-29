import { SettingsProvider } from '../../../provider/settingsProvider';
import { Builds, Languages } from '../../../types/types';
import { gatherIncludeDirsMsvc } from '../../../utils/compilerUtils';

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
