import * as vscode from 'vscode';

export interface JsonSettings {
  [name: string]: string;
}

export interface JsonConfiguration {
  configurations: any[];
}

export interface JsonInnerTask {
  args: string[];
  command: string;
  type: any;
  options: any;
  label: any;
}

export interface JsonTask {
  tasks: JsonInnerTask[];
}

export class Task extends vscode.Task {
  override execution?: vscode.ProcessExecution;
}

export class Commands {
  foundGcc: boolean = false;
  pathGcc: string | undefined;
  foundGpp: boolean = false;
  pathGpp: string | undefined;
  foundClang: boolean = false;
  pathClang: string | undefined;
  foundClangpp: boolean = false;
  pathClangpp: string | undefined;
  foundGdb: boolean = false;
  pathGDB: string | undefined;
  foundLLDB: boolean = false;
  pathLLDB: string | undefined;
}

export enum Languages {
  c = 'C',
  cpp = 'Cpp',
}

export enum Compilers {
  gcc = 'gcc',
  gpp = 'g++',
  clang = 'clang',
  clangpp = 'clang++',
  cl = 'cl'
}

export enum Debuggers {
  lldb = 'lldb',
  gdb = 'gdb',
}

export enum CompilerSystems {
  cygwin = 'cygwin',
  mingw = 'mingw',
  msys2 = 'msys2',
  clang = 'clang',
  msvc = 'msvc',
}

export enum OperatingSystems {
  windows = 'windows',
  linux = 'linux',
  mac = 'macos',
}

export enum Architectures {
  x86 = 'x86',
  x64 = 'x64',
  ARM64 = 'ARM64'
}

export enum Builds {
  debug = 'Debug',
  release = 'Release',
}

export enum Tasks {
  build = 'Build',
  run = 'Run',
  clean = 'Clean',
  debug = 'Debug',
}
