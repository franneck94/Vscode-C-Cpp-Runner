import * as vscode from 'vscode';

export interface JsonSettings {
  [name: string]: string;
}

export interface JsonPropertiesConfigEntry {
  name: string;
  includePath: string[];
  compilerPath: string;
  cStandard: string;
  cppStandard: string;
  intelliSenseMode: string;
  compilerArgs: string[];
}

export interface JsonPropertiesConfig {
  configurations: JsonPropertiesConfigEntry[];
}

export interface JsonLaunchConfigEntry extends vscode.DebugConfiguration {
  type: string;
  request: string;
  args: string[];
  stopAtEntry: boolean;
  externalConsole: boolean;
  cwd: string;
  environment: string[];
  program: string;
  MIMode?: string;
  miDebuggerPath?: string;
  setupCommands?: any[];
}

export interface JsonLaunchConfig {
  configurations: JsonLaunchConfigEntry[];
}

export class Task extends vscode.Task {
  override execution?: vscode.ProcessExecution;
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
