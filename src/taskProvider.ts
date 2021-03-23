/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { SettingsProvider } from './settings';
import { pathExists } from "./utils";

enum LanguageMode {
  c = 'C',
  cpp = 'Cpp'
}

const extensionName: string = 'C_Cpp_Runner';

export class TaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;
  public extDirectory: string;
  public problemMatcher: string;

  constructor(public settingsProvider: SettingsProvider) {
    this.extDirectory = path.dirname(__dirname);
    this.tasksFile = path.join(this.extDirectory, "tasks", "tasks.json");
    this.makefileFile = path.join(this.extDirectory, "tasks", "Makefile");
    this.problemMatcher = "$gcc";

    if (!pathExists(this.tasksFile) || !pathExists(this.makefileFile)) {
      return;
    }

    this.getTasks();
  }

  public async resolveTask(task: vscode.Task, token: vscode.CancellationToken) {
    return task;
  }

  public async provideTasks(): Promise<vscode.Task[]> {
    return this.getTasks();
  }

  public async getTasks(): Promise<vscode.Task[]> {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    const emptyTasks: vscode.Task[] = [];
    if (!editor) {
      return emptyTasks;
    }

    const fileExt: string = path.extname(editor.document.fileName);
    if (!fileExt) {
      return emptyTasks;
    }

    if (!this.isSourceFile(fileExt)) {
      return emptyTasks;
    }


    if (!pathExists(this.tasksFile)) {
      return [];
    }

    let configJson;
    try {
      const fileContent = fs.readFileSync(this.tasksFile, "utf-8");
      configJson = JSON.parse(fileContent);
    } catch (err) {
      return [];
    }

    if (!configJson.tasks) {
      return [];
    }

    this.tasks = [];
    const languageMode = TaskProvider.getLanguageMode(fileExt);

    for (let taskJson of configJson.tasks) {
      if (taskJson.type !== "shell") {
        continue;
      }
      if (taskJson.options !== undefined) {
        if (taskJson.options.hide === true) {
          continue;
        }
      }

      this.updateTaskBasedOnSettings(taskJson, languageMode);

      const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;

      const definition = {
        type: "shell",
        task: taskJson.label
      };
      const scope: vscode.TaskScope = vscode.TaskScope.Workspace;
      const task = new vscode.Task(
        definition,
        scope,
        taskJson.label,
        extensionName,
        new vscode.ShellExecution(shellCommand),
        this.problemMatcher
      );
      this.tasks.push(task);
    }

    return this.tasks;
  }

  private updateTaskBasedOnSettings(taskJson: any, languageMode: LanguageMode) {
    taskJson.args[1] = `--file=${this.makefileFile}`;
    taskJson.args.push(
      `ENABLE_WARNINGS=${+this.settingsProvider.enableWarnings}`
    );
    taskJson.args.push(
      `WARNINGS="${this.settingsProvider.warnings}"`
    );
    taskJson.args.push(
      `WARNINGS_AS_ERRORS=${+this.settingsProvider.warningsAsError}`
    );
    taskJson.args.push(
      `C_COMPILER=${this.settingsProvider.compilerPathC}`
    );
    taskJson.args.push(
      `CPP_COMPILER=${this.settingsProvider.compilerPathCpp}`
    );
    taskJson.args.push(
      `LANGUAGE_MODE=${languageMode}`
    );
    taskJson.args.push(
      `C_STANDARD=${this.settingsProvider.standardC}`
    );
    taskJson.args.push(
      `CPP_STANDARD=${this.settingsProvider.standardCpp}`
    );
    taskJson.command = this.settingsProvider.makePath;
  }

  private isSourceFile(fileExt: string) {
    const fileExtLower: string = fileExt.toLowerCase();
    const isHeader: boolean = !fileExt || [
      ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
    ].some(ext => fileExtLower === ext);
    if (isHeader) {
      return false;
    }

    let fileIsCpp: boolean;
    let fileIsC: boolean;
    if (fileExt === ".C") {
      fileIsCpp = true;
      fileIsC = true;
    } else {
      fileIsCpp = [
        ".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"
      ].some(ext => fileExtLower === ext);
      fileIsC = fileExtLower === ".c";
    }
    if (!(fileIsCpp || fileIsC)) {
      return false;
    }

    return true;
  }

  static getLanguageMode(fileExt: string) {
    const fileExtLower: string = fileExt.toLowerCase();

    if (fileExtLower === ".c") {
      return LanguageMode.c;
    } else {
      return LanguageMode.cpp;
    }
  }

}
