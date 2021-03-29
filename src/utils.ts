import * as fs from "fs";
import * as path from "path";
import { platform } from "os";
import { lookpath } from "lookpath";
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';

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

export enum OperatingSystems {
  windows = "windows",
  linux = "linux",
  mac = "macos"
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

export function readJsonFile(path: string) {
  let configJson;
    try {
      const fileContent = fs.readFileSync(path, "utf-8");
      configJson = JSON.parse(fileContent);
    } catch (err) {
      return;
    }

    if (!configJson.configurations) {
      return;
    }

    return configJson;
}

export function getPlattformCategory() {
  const plattformName = platform();
  let plattformCategory: OperatingSystems;

  if ("win32" === plattformName || "cygwin" === plattformName) {
    plattformCategory = OperatingSystems.windows;
  } else if ("darwin" === plattformName) {
    plattformCategory = OperatingSystems.mac;
  } else {
    plattformCategory = OperatingSystems.linux;
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

export function getArchitecture(compiler: Compilers) {
  let command = `${compiler} -dumpmachine`;
  let byteArray = execSync(command);
  let str = String.fromCharCode(...byteArray);

  if (str.includes("64")) {
    return Architectures.x64;
  } else {
    return Architectures.x86;
  }
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
  return [".hpp", ".hh", ".hxx", ".h"].some(
    (ext) => fileExtLower === ext
  );
}

export function isCppSourceFile(fileExtLower: string) {
  return [".cpp", ".cc", ".cxx"].some(
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
