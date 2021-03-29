import * as fs from "fs";
import * as path from "path";
import { platform } from "os";
import { lookpath } from "lookpath";
import { execSync } from "child_process";

export enum Languages {
  c = "C",
  cpp = "Cpp",
}

export enum Compilers {
  gcc = "gcc",
  gpp = "g++",
  clang = "clang",
  clangpp = "clang++",
}

export enum OperatingSystems {
  windows = "windows",
  linux = "linux",
  mac = "macos",
}

export enum Architectures {
  x86 = "x86",
  x64 = "x64",
}

export function pathExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
  } catch (err) {
    return false;
  }

  return true;
}

export function readJsonFile(filePath: string): any | undefined {
  let configJson;
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    configJson = JSON.parse(fileContent);
  } catch (err) {
    return undefined;
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
  const commandPath = await lookpath(command);

  if (undefined === commandPath) {
    return { found: false, path: commandPath };
  }

  return { found: true, path: commandPath };
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

  if (isHeaderFile(fileExtLower)) {
    return false;
  }

  if (!(isCSourceFile(fileExtLower) || isCppSourceFile(fileExtLower))) {
    return false;
  }

  return true;
}

export function isHeaderFile(fileExtLower: string) {
  return [".hpp", ".hh", ".hxx", ".h"].some((ext) => fileExtLower === ext);
}

export function isCppSourceFile(fileExtLower: string) {
  return [".cpp", ".cc", ".cxx"].some((ext) => fileExtLower === ext);
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

export function getLanguageFromEditor(
  editor: any | undefined,
  filePath: string
) {
  let language: Languages;

  if (!editor) {
    language = getLanguage(filePath);
  } else {
    if (".vscode" !== path.dirname(editor.document.fileName)) {
      const fileDirName = path.dirname(editor.document.fileName);
      language = getLanguage(fileDirName);
    }
    language = getLanguage(filePath);
  }

  return language;
}
