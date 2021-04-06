import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { lookpath } from 'lookpath';
import { platform } from 'os';

import { Architectures, Compilers, Languages, OperatingSystems } from './types';

const STATUS_BAR_ALIGN = vscode.StatusBarAlignment.Left;
const STATUS_BAR_PRIORITY = 50;

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

export function pathExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
  } catch (err) {
    return false;
  }

  return true;
}

export function mkdirRecursive(filePath: string) {
  fs.mkdirSync(filePath, { recursive: true });
}

export function readJsonFile(filePath: string): any | undefined {
  let configJson;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    configJson = JSON.parse(fileContent);
  } catch (err) {
    return undefined;
  }

  return configJson;
}

export function writeJsonFile(outputFilePath: string, jsonContent: any) {
  const jsonString = JSON.stringify(jsonContent, null, 2);
  fs.writeFileSync(outputFilePath, jsonString);
}

export function getOperatingSystem() {
  const plattformName = platform();
  let operatingSystem: OperatingSystems;

  if (plattformName === 'win32' || plattformName === 'cygwin') {
    operatingSystem = OperatingSystems.windows;
  } else if (plattformName === 'darwin') {
    operatingSystem = OperatingSystems.mac;
  } else {
    operatingSystem = OperatingSystems.linux;
  }

  return operatingSystem;
}

export async function commandExists(command: string) {
  let commandPath = await lookpath(command);

  if (!commandPath) {
    return { f: false, p: commandPath };
  }

  if (commandPath.includes('.EXE')) {
    commandPath = commandPath.replace('.EXE', '.exe');
  }

  return { f: true, p: commandPath };
}

export function getArchitecture(compiler: Compilers) {
  const command = `${compiler} -dumpmachine`;

  try {
    const byteArray = execSync(command);
    const str = String.fromCharCode(...byteArray);

    if (str.includes('64')) {
      return Architectures.x64;
    } else {
      return Architectures.x86;
    }
  } catch (err) {
    return Architectures.x86;
  }
}

export function isSourceFile(fileExt: string) {
  const fileExtLower = fileExt.toLowerCase();

  if (isHeaderFile(fileExtLower)) {
    return false;
  }

  if (!(isCSourceFile(fileExtLower) || isCppSourceFile(fileExtLower))) {
    return false;
  }

  return true;
}

export function isHeaderFile(fileExtLower: string) {
  return ['.hpp', '.hh', '.hxx', '.h'].some((ext) => fileExtLower === ext);
}

export function isCppSourceFile(fileExtLower: string) {
  return ['.cpp', '.cc', '.cxx'].some((ext) => fileExtLower === ext);
}

export function isCSourceFile(fileExtLower: string) {
  return fileExtLower === '.c';
}

export function getLanguage(fileDirName: string) {
  const fileDirents = fs.readdirSync(fileDirName, { withFileTypes: true });
  const files = fileDirents
    .filter((file) => file.isFile())
    .map((file) => file.name);
  const anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));

  if (anyCppFile) {
    return Languages.cpp;
  } else {
    return Languages.c;
  }
}

export function getDirectories(folder: fs.PathLike) {
  const fileDirents = fs.readdirSync(folder, {
    withFileTypes: true,
  });
  let directories = fileDirents
    .filter((dir) => dir.isDirectory())
    .map((dir) => path.join(folder.toString(), dir.name));
  directories = directories.filter((dir) => !dir.includes('.vscode'));
  directories = directories.filter((dir) => !dir.includes('build'));
  if (directories.length === 0) {
    return;
  }
  directories.forEach((dir) =>
    getDirectories(dir)?.forEach((newDir) => directories.push(newDir)),
  );
  return directories;
}

export function disposeItem(disposableItem: vscode.Disposable) {
  if (disposableItem) {
    disposableItem.dispose();
  }
}

export function filterOnString(names: string[], filterName: string) {
  return names.filter((name) => !name.includes(filterName));
}

export function createStatusBarItem() {
  return vscode.window.createStatusBarItem(
    STATUS_BAR_ALIGN,
    STATUS_BAR_PRIORITY,
  );
}
