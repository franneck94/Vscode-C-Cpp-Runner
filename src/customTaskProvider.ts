/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { pathExists } from "./utils";

export class CustomBuildTaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;
  public extDirectory: string;

  constructor() {
	this.extDirectory = path.dirname(__dirname)
    this.tasksFile = path.join(this.extDirectory, "tasks", "tasks.json");
	this.makefileFile = path.join(this.extDirectory, "tasks", "Makefile");

    if (!pathExists(this.tasksFile) || !pathExists(this.makefileFile)) {
      return;
    }

	this.getTasks();
  }

  public async provideTasks(): Promise<vscode.Task[]> {
    return this.getTasks();
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    return _task;
  }

  private getTasks(): vscode.Task[] {
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

      const task = new vscode.Task(
        {
          type: "shell",
          task: taskJson.label,
        },
        taskJson.label,
        "Runner.run",
        new vscode.ShellExecution(shellCommand)
      );
      this.tasks.push(task);
    }

    return this.tasks;
  }
}
