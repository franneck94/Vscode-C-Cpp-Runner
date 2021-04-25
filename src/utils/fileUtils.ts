import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as JSON5 from 'json5';

import { Languages } from './types';
import * as logger from './logger';
import { loggingActive } from '../extension';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

export function mkdirRecursive(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const errorMessage = `mkdirRecursive: ${err}`;
    logger.log(loggingActive, errorMessage);

    return false;
  }
}

export function filterOnString(names: string[], filterName: string) {
  return names.filter((name) => !name.includes(filterName));
}

export function pathExists(filepath: string) {
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

  if (directories.length === 0) return;

  directories.forEach((dir) =>
    getDirectories(dir)?.forEach((newDir) => directories.push(newDir)),
  );

  return directories;
}

function readDir(dir: string | fs.PathLike) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    const errorMessage = `readDir: ${err}`;
    logger.log(loggingActive, errorMessage);

    return undefined;
  }
}

export function filesInDir(dir: string) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  const files = fileDirents
    .filter((file) => file.isFile())
    .map((file) => file.name);

  return files;
}

export function foldersInDir(dir: fs.PathLike) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  let folders = fileDirents.filter((folder) => folder.isDirectory());
  folders = folders.filter((folder) => !folder.name.includes('.'));
  folders = folders.filter((folder) => !folder.name.includes('build'));
  folders = folders.filter((folder) => !folder.name.includes('CMakeFiles'));
  const folderNames = folders.map((folder) =>
    path.join(dir.toString(), folder.name),
  );

  return folderNames;
}

export function readJsonFile(filepath: string) {
  let configJson: any | undefined;

  try {
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    configJson = JSON5.parse(fileContent);
  } catch (err) {
    const errorMessage = `readJsonFile: ${err}`;
    logger.log(loggingActive, errorMessage);

    return undefined;
  }

  return configJson;
}

export function writeJsonFile(outputFilePath: string, jsonContent: any) {
  const dirname = path.dirname(outputFilePath);

  if (!pathExists(dirname)) {
    mkdirRecursive(dirname);
  }

  const jsonString = JSON.stringify(jsonContent, null, 2);

  try {
    fs.writeFileSync(outputFilePath, jsonString);
  } catch (err) {
    const errorMessage = `writeJsonFile: ${err}`;
    logger.log(loggingActive, errorMessage);

    return;
  }
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
    const config = vscode.workspace.getConfiguration('cmake');
    const cmakeSetting = config.get('sourceDirectory');

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
