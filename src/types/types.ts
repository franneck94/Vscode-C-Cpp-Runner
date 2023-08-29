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
  stopAtEntry?: boolean;
  console?: string;
  externalConsole?: boolean;
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
  cuda = 'Cuda',
}

export enum CompilerSystems {
  gcc = 'gcc',
  clang = 'clang',
  msvc = 'msvc',
}

export enum Debuggers {
  lldb = 'lldb',
  gdb = 'gdb',
}

export enum OperatingSystems {
  windows = 'windows',
  linux = 'linux',
  mac = 'macos',
}

export enum Architectures {
  x86 = 'x86',
  x64 = 'x64',
  ARM64 = 'ARM64',
}

export enum Builds {
  debug = 'Debug',
  release = 'Release',
}
