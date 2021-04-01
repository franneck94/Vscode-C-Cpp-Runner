import { execSync } from 'child_process';
import * as fs from 'fs';
import { lookpath } from 'lookpath';
import { platform } from 'os';
import * as path from 'path';

export interface JsonInterface {
  configurations: any[];
}

export interface TasksInterface {
  tasks: any[];
}

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

export enum Debuggers {
  lldb = "lldb",
  gdb = "gdb",
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

export function writeJsonFile(outputFilePath: string, jsonContent: any) {
  const jsonString = JSON.stringify(jsonContent, null, 2);
  fs.writeFileSync(outputFilePath, jsonString);
}

export function getOperatingSystem() {
  const plattformName = platform();
  let operatingSystem: OperatingSystems;

  if (plattformName === "win32" || plattformName === "cygwin") {
    operatingSystem = OperatingSystems.windows;
  } else if (plattformName === "darwin") {
    operatingSystem = OperatingSystems.mac;
  } else {
    operatingSystem = OperatingSystems.linux;
  }

  return operatingSystem;
}

export async function commandExists(command: string) {
  let commandPath = await lookpath(command);

  if (undefined === commandPath) {
    return { found: false, path: commandPath };
  }

  if (commandPath.includes(".EXE")) {
    commandPath = commandPath.replace(".EXE", ".exe");
  }

  return { found: true, path: commandPath };
}

export function getArchitecture(compiler: Compilers) {
  const command = `${compiler} -dumpmachine`;

  try {
    const byteArray = execSync(command);
    const str = String.fromCharCode(...byteArray);

    if (str.includes("64")) {
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
  return [".hpp", ".hh", ".hxx", ".h"].some((ext) => fileExtLower === ext);
}

export function isCppSourceFile(fileExtLower: string) {
  return [".cpp", ".cc", ".cxx"].some((ext) => fileExtLower === ext);
}

export function isCSourceFile(fileExtLower: string) {
  return fileExtLower === ".c";
}

export function getLanguage(fileDirName: string) {
  const files = fs.readdirSync(fileDirName);
  const anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));

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
    if (path.dirname(editor.document.fileName) !== ".vscode") {
      const fileDirName = path.dirname(editor.document.fileName);
      language = getLanguage(fileDirName);
    }
    language = getLanguage(filePath);
  }

  return language;
}
