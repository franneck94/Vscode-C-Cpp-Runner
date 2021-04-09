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

export function pathExists(filepath: string): boolean {
  try {
    fs.accessSync(filepath);
  } catch (err) {
    return false;
  }

  return true;
}

export function mkdirRecursive(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function filesInDir(dir: string) {
  const fileDirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = fileDirents
    .filter((file) => file.isFile())
    .map((file) => file.name);
  return files;
}

export function foldersInDir(dir: fs.PathLike) {
  const fileDirents = fs.readdirSync(dir, {
    withFileTypes: true,
  });
  let folders = fileDirents.filter((folder) => folder.isDirectory());
  folders = folders.filter((folder) => !folder.name.includes('.vscode'));
  folders = folders.filter((folder) => !folder.name.includes('build'));
  folders = folders.filter((folder) => !folder.name.startsWith('.'));
  const folderNames = folders.map((folder) =>
    path.join(dir.toString(), folder.name),
  );
  return folderNames;
}

export function readJsonFile(filepath: string): any | undefined {
  let configJson;
  try {
    const fileContent = fs.readFileSync(filepath, 'utf-8');
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

export function getLanguage(dir: string) {
  const files = filesInDir(dir);
  const anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));

  if (anyCppFile) {
    return Languages.cpp;
  } else {
    return Languages.c;
  }
}

export function getDirectories(dir: fs.PathLike) {
  const directories = foldersInDir(dir);
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
