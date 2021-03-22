/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { pathExists } from "./utils";


export class CppBuildTaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;
  public extDirectory: string;
  public problemMatcher: string;

  constructor() {
    this.extDirectory = path.dirname(__dirname)
    this.tasksFile = path.join(this.extDirectory, "tasks", "tasks.json");
    this.makefileFile = path.join(this.extDirectory, "tasks", "Makefile");

    this.problemMatcher = "$gcc";

    if (!pathExists(this.tasksFile) || !pathExists(this.makefileFile)) {
      return;
    }

    this.getTasks();
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

    this.tasks = [];
    if (!pathExists(this.tasksFile)) {
      return this.tasks;
    }

    let configJson;
    try {
      const fileContent = fs.readFileSync(this.tasksFile, "utf-8");
      configJson = JSON.parse(fileContent);
    } catch (err) {
      return this.tasks;
    }

    if (!configJson.tasks) {
      return this.tasks;
    }

    for (let taskJson of configJson.tasks) {
      if (taskJson.type !== "shell") {
        continue;
      }
      if (taskJson.options !== undefined) {
        if (taskJson.options.hide === true) {
          continue;
        }
      }

      taskJson.args[1] = `--file=${this.makefileFile}`

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
        "C_Cpp_Runner",
        new vscode.ShellExecution(shellCommand),
        this.problemMatcher
      );
      this.tasks.push(task);
    }

    return this.tasks;
  }

  private isSourceFile(fileExt: string) {
    // Don't offer tasks for header files.
    const fileExtLower: string = fileExt.toLowerCase();
    const isHeader: boolean = !fileExt || [
      ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
    ].some(ext => fileExtLower === ext);
    if (isHeader) {
      return false;
    }

    // Don't offer tasks if the active file's extension is not a recognized C/C++ extension.
    let fileIsCpp: boolean;
    let fileIsC: boolean;
    if (fileExt === ".C") { // ".C" file extensions are both C and C++.
      fileIsCpp = true;
      fileIsC = true;
    } else {
      fileIsCpp = [".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"].some(ext => fileExtLower === ext);
      fileIsC = fileExtLower === ".c";
    }
    if (!(fileIsCpp || fileIsC)) {
      return false;
    }

    return true;
  }

}
