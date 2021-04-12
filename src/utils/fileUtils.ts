import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as JSON5 from 'json5';

import { Languages } from './types';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

export function mkdirRecursive(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function filterOnString(names: string[], filterName: string) {
  return names.filter((name) => !name.includes(filterName));
}

export function pathExists(filepath: string): boolean {
  try {
    fs.accessSync(filepath);
  } catch (err) {
    return false;
  }

  return true;
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
    configJson = JSON5.parse(fileContent);
  } catch (err) {
    return undefined;
  }

  return configJson;
}

export function writeJsonFile(outputFilePath: string, jsonContent: any) {
  const jsonString = JSON.stringify(jsonContent, null, 2);
  fs.writeFileSync(outputFilePath, jsonString);
}

export function noCmakeFileFound() {
  let foundNoCmakeFile = true;
  const workspaceFodlers = vscode.workspace.workspaceFolders;

  if (workspaceFodlers) {
    workspaceFodlers.forEach((folder) => {
      const files = filesInDir(folder.uri.fsPath);
      files.forEach((file) => {
        if (file.toLowerCase() === 'CMakeLists.txt'.toLowerCase()) {
          foundNoCmakeFile = false;
        }
      });
    });
  }

  if (foundNoCmakeFile) {
    const config = vscode.workspace.getConfiguration();
    const cmakeSetting = config.get('cmake.sourceDirectory');

    if (cmakeSetting && cmakeSetting !== '${workspaceFolder}') {
      foundNoCmakeFile = false;
    }
  }

  return foundNoCmakeFile;
}

export function naturalSort(names: string[]) {
  return names.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}
