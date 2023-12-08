import * as fs from 'fs';
import * as JSON5 from 'json5';
import * as minimatch from 'minimatch';
import * as path from 'path';
import * as vscode from 'vscode';

import { Languages } from '../types/enums';
import { JsonSettings } from '../types/interfaces';

export function replaceBackslashes(text: string) {
  return text.replace(/\\/g, '/');
}

export function mkdirRecursive(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {}
}

export function rmdirRecursive(dir: string) {
  try {
    fs.rmdirSync(dir, { recursive: true });
  } catch (err) {}
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

  if (
    !isCSourceFile(fileExtLower) &&
    !isCppSourceFile(fileExtLower) &&
    !isCudaSourceFile(fileExtLower)
  ) {
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

export function isCudaSourceFile(fileExtLower: string) {
  fileExtLower = addFileExtensionDot(fileExtLower);
  return fileExtLower === '.cu';
}

export function getLanguage(dir: string) {
  const files = filesInDir(dir);

  const anyCudaFile = files.some((file) =>
    isCudaSourceFile(path.extname(file)),
  );
  const anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));

  if (anyCudaFile) {
    return Languages.cuda;
  } else if (anyCppFile) {
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
  } catch (err) {}
}

export function filesInDir(dir: string) {
  const fileDirents = readDir(dir);

  if (!fileDirents) return [];

  const hasSpace = dir.includes(' ');
  const files = fileDirents
    .filter((file) => file.isFile())
    .map((file) => (hasSpace ? file.name : path.join(dir, file.name)));

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

  const folders = fileDirents.filter((folder: fs.Dirent) =>
    folder.isDirectory(),
  );
  const folderNames = folders.map((folder: fs.Dirent) =>
    path.join(dir.toString(), folder.name),
  );

  return folderNames;
}

export function readJsonFile(filepath: string) {
  let configJson: any | undefined;

  try {
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    configJson = JSON5.parse(fileContent);
  } catch (err) {}

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
  } catch (err) {}
}

export function naturalSort(names: string[]) {
  return names.sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

export function localSettingExist(key: string, jsonData: JsonSettings) {
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

export function getOccurenceIndicies(text: string, char: string) {
  const indices = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === char) indices.push(i);
  }

  return indices;
}

export function getAllSourceFilesFolderBased(dir: string) {
  const language = getLanguage(dir);

  let files: string[] = [];
  files = filesInDir(dir);
  const filteredFiles = files.filter((file: string) =>
    isSourceFile(path.extname(file)),
  );
  return { files: filteredFiles, language: language };
}

export function getAllSourceFilesSingleFileBased() {
  let language = Languages.c;
  let files: string[] = [];

  const currentFile = vscode.window.activeTextEditor?.document.fileName;
  if (!currentFile) return { files: [], language: language };

  if (isCppSourceFile(path.extname(currentFile))) {
    language = Languages.cpp;
  } else if (isCSourceFile(path.extname(currentFile))) {
    language = Languages.c;
  } else {
    language = Languages.cuda;
  }

  const isSource = isSourceFile(path.extname(currentFile));
  if (!isSource) return { files: [], language: language };

  if (currentFile.includes(' ')) {
    files = [path.basename(currentFile)];
  } else {
    files = [currentFile];
  }

  return { files: files, language: language };
}

export function getAllSourceFilesInDir(dir: string, singleFileBuild: boolean) {
  if (singleFileBuild) return getAllSourceFilesSingleFileBased();

  return getAllSourceFilesFolderBased(dir);
}

export function getBuildModeDir(activeFolder: string, buildMode: string) {
  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  return modeDir;
}

export function isNonRelativePath(path: string) {
  return path.includes('/') || path.includes('\\');
}
