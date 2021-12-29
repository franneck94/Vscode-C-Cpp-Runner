import * as fs from 'fs';
import * as JSON5 from 'json5';
import * as minimatch from 'minimatch';
import * as path from 'path';

import { loggingActive } from '../extension';
import * as logger from './logger';
import { JsonSettings, Languages } from './types';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

export function mkdirRecursive(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    const errorMessage = `mkdirRecursive: ${err}`;
    logger.log(loggingActive, errorMessage);
  }
}

export function rmdirRecursive(dir: string) {
  try {
    fs.rmdirSync(dir, { recursive: true });
  } catch (err) {
    const errorMessage = `rmdirSync: ${err}`;
    logger.log(loggingActive, errorMessage);
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

export function addFileExtensionDot(fileExt: string) {
  if (!fileExt.includes('.')) {
    fileExt = `.${fileExt}`;
  }

  return fileExt;
}

export function isHeaderFile(fileExtLower: string) {
  fileExtLower = addFileExtensionDot(fileExtLower);
  return ['.hpp', '.hh', '.hxx', '.h'].some((ext) => fileExtLower === ext);
}

export function isCppSourceFile(fileExtLower: string) {
  fileExtLower = addFileExtensionDot(fileExtLower);
  return ['.cpp', '.cc', '.cxx'].some((ext) => fileExtLower === ext);
}

export function isCSourceFile(fileExtLower: string) {
  fileExtLower = addFileExtensionDot(fileExtLower);
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

export function getDirectoriesRecursive(dir: fs.PathLike) {
  const directories = foldersInDir(dir);

  if (directories.length === 0) return;

  directories.forEach((dir) =>
    getDirectoriesRecursive(dir)?.forEach((newDir) => directories.push(newDir)),
  );

  return directories;
}

export function readDir(dir: string | fs.PathLike) {
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

export function includePatternFromList(
  includeSearch: string[],
  foldersList: string[],
) {
  const result: string[] = [];

  for (const pattern of includeSearch) {
    result.push(...foldersList.filter((folder) => minimatch(folder, pattern)));
  }

  return result;
}

export function excludePatternFromList(
  excludeSearch: string[],
  foldersList: string[],
) {
  for (const pattern of excludeSearch) {
    foldersList = foldersList.filter((folder) => !minimatch(folder, pattern));
  }

  return foldersList;
}

export function foldersInDir(dir: fs.PathLike) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  const folders = fileDirents.filter((folder) => folder.isDirectory());
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
  if (jsonContent === undefined) return;

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

export function naturalSort(names: string[]) {
  return names.sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

export function commandCheck(key: string, jsonData: JsonSettings) {
  const commandPath = jsonData[key];

  if (!commandPath) return false;

  if (!pathExists(commandPath)) return false;

  return true;
}

export function hasPathSeperators(pathStr: string) {
  return pathStr.includes('/') || pathStr.includes('\\');
}

export function removeExtension(pathStr: string, ext: string) {
  const extStr = addFileExtensionDot(ext);

  if (pathStr.includes(extStr)) {
    return pathStr.replace(extStr, '');
  }

  return pathStr;
}

export function getBasename(pathStr: string) {
  if (hasPathSeperators(pathStr)) {
    return path.basename(pathStr);
  }

  return pathStr;
}
