import * as vscode from 'vscode';

export interface JsonSettings {
  [name: string]: any;
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
  /**
   * The task's execution engine: ShellExecution only
   */
  execution?: vscode.ShellExecution;
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
