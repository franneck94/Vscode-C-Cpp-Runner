import * as fs from 'fs';
import * as path from "path";
import { platform } from 'os';
import { lookpath } from 'lookpath';

export enum LanguageMode {
  c = 'C',
  cpp = 'Cpp'
}

export function pathExists(path: string): boolean {
  try {
    fs.accessSync(path);
  } catch (err) {
    return false;
  }

  return true;
}

export function getPlattformCategory() {
  const plattformName = platform();
  let plattformCategory: string;

  if (plattformName === 'win32' || plattformName === 'cygwin') {
    plattformCategory = 'windows';
  }
  else if (plattformName === 'darwin') {
    plattformCategory = 'macos';
  }
  else {
    plattformCategory = 'linux';
  }

  return plattformCategory;
}

export async function commandExists(command: string) {
  const path = await lookpath(command);

  if (path === undefined) {
    return { found: false, path: path };
  }

  return { found: true, path: path };
}

export function isSourceFile(fileExt: string) {
  const fileExtLower: string = fileExt.toLowerCase();
  const isHeader: boolean = !fileExt || [
    ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
  ].some(ext => fileExtLower === ext);

  if (isHeader) {
    return false;
  }

  let fileIsCpp: boolean;
  let fileIsC: boolean;

  fileIsC = isCSourceFile(fileExtLower);
  fileIsCpp = isCppSourceFile(fileExtLower);

  if (!(fileIsCpp || fileIsC)) {
    return false;
  }

  return true;
}

export function isCppSourceFile(fileExtLower: string) {
  return [
    ".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"
  ].some(ext => fileExtLower === ext);
}

export function isCSourceFile(fileExtLower: string) {
  return fileExtLower === '.c';
}

export function getLanguageMode(fileDirName: string) {
  let files = fs.readdirSync(fileDirName);
  let anyCppFile = files.some(file => isCppSourceFile(path.extname(file)));

  if (anyCppFile) {
    return LanguageMode.cpp;
  } else {
    return LanguageMode.c;
  }
}
