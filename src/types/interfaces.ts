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
