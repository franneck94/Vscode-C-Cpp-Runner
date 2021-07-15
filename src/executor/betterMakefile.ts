import * as path from 'path';
import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import {
	filesInDir,
	isCppSourceFile,
	isCSourceFile,
	mkdirRecursive,
	pathExists,
} from '../utils/fileUtils';
import { Builds, Task } from '../utils/types';

export class BetterMakefile {
  constructor() {}

  public static async executeTask(
    task: Task,
    settingsProvider: SettingsProvider,
    activeFolder: string,
  ) {
    const files = filesInDir(activeFolder);
    const compilatonMode = Builds.debug;
    const buildDir = path.join(activeFolder, `build/${compilatonMode}/`);

    for (const file of files) {
      const fileExtension = path.parse(file).ext;
      if (!isCSourceFile(fileExtension) && !isCppSourceFile(fileExtension)) {
        continue;
      }

      const fileBaseName = path.parse(file).name;
      const filePath = path.join(activeFolder, file);
      const objectFilePath = path.join(buildDir, fileBaseName + '.o');
      if (!pathExists(buildDir)) {
        mkdirRecursive(buildDir);
      }

      const compiler = settingsProvider.cppCompiler;
      const useWarnings = settingsProvider.enableWarnings;
      const warningsAsErrors = settingsProvider.warningsAsError;
      let warnings: string = '';
      if (useWarnings) {
        warnings = settingsProvider.warnings.join(' ');
      }
      if (useWarnings && warningsAsErrors) {
        warnings += ' -Werror';
      }
      const cppStandard = settingsProvider.cppStandard;
      const includePaths = settingsProvider.includePaths;
      const includes = includePaths.join(' -I ');
      const compilerArgs = settingsProvider.compilerArgs;

      let fullCompilerArgs = '';
      if (warnings) {
        fullCompilerArgs += `${warnings}`;
      }
      if (cppStandard) {
        fullCompilerArgs += ` --std=${cppStandard}`;
      }
      if (compilatonMode == Builds.debug) {
        fullCompilerArgs += ' -g3 -O0';
      } else {
        fullCompilerArgs += ' -O3 -DNDEBUG';
      }
      fullCompilerArgs += `${compilerArgs} ${includes}`;
      const fileArgs = `${filePath} -o ${objectFilePath}`;
      task.execution.commandLine = `${compiler} ${fullCompilerArgs} ${fileArgs}`;
      await vscode.tasks.executeTask(task);
    }

    // Exe task
    const objectFiles = filesInDir(buildDir);
    task.execution.commandLine = `${objectFiles.join(' ')} -o Test.exe`;
    await vscode.tasks.executeTask(task);
  }
}
