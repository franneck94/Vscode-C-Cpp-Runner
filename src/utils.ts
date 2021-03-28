import * as fs from "fs";
import * as path from "path";
import { platform } from "os";
import { lookpath } from "lookpath";

export enum Languages {
  c = "C",
  cpp = "Cpp",
}

export enum Compilers {
  gcc = "gcc",
  gpp = "g++",
  clang = "clang",
  clangpp = "clang++"
}

export enum Architectures {
  x86 = "x86",
  x64 = "x64"
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

  if ("win32" === plattformName || "cygwin" === plattformName) {
    plattformCategory = "windows";
  } else if ("darwin" === plattformName) {
    plattformCategory = "macos";
  } else {
    plattformCategory = "linux";
  }

  return plattformCategory;
}

export async function commandExists(command: string) {
  const path = await lookpath(command);

  if (undefined === path) {
    return { found: false, path: path };
  }

  return { found: true, path: path };
}

export async function getArchitecture(command: string) {
  let { found: _, path: p } = await commandExists(command);
  let i = 2;
}

export function isSourceFile(fileExt: string) {
  const fileExtLower = fileExt.toLowerCase();
  const isHeader = isHeaderFile(fileExtLower);

  if (isHeader) {
    return false;
  }

  let fileIsC = isCSourceFile(fileExtLower);
  let fileIsCpp = isCppSourceFile(fileExtLower);

  if (!(fileIsCpp || fileIsC)) {
    return false;
  }

  return true;
}

export function isHeaderFile(fileExtLower: string) {
  return [".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ""].some(
    (ext) => fileExtLower === ext
  );
}

export function isCppSourceFile(fileExtLower: string) {
  return [".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"].some(
    (ext) => fileExtLower === ext
  );
}

export function isCSourceFile(fileExtLower: string) {
  return ".c" === fileExtLower;
}

export function getLanguage(fileDirName: string) {
  let files = fs.readdirSync(fileDirName);
  let anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));

  if (anyCppFile) {
    return Languages.cpp;
  } else {
    return Languages.c;
  }
}
