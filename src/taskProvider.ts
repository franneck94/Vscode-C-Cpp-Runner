import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { SettingsProvider } from './settingsProvider';
import { pathExists, LanguageMode, getLanguageMode } from "./utils";

const extensionName: string = 'C_Cpp_Runner';

export class TaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;
  public problemMatcher: string;

  constructor(public settingsProvider: SettingsProvider) {
    const extDirectory = path.dirname(__dirname);
    const tasksDirectory = path.join(extDirectory, "src", "tasks");
    this.tasksFile = path.join(tasksDirectory, "tasks.json");
    this.makefileFile = path.join(tasksDirectory, "Makefile");
    this.problemMatcher = "$gcc";

    if (!pathExists(this.tasksFile) || !pathExists(this.makefileFile)) {
      return;
    }

    this.getTasks();
  }

  public async resolveTask(task: vscode.Task, token: vscode.CancellationToken) {
    return task;
  }

  public provideTasks(): vscode.Task[] {
    return this.getTasks();
  }

  public getTasks(ignoreLanguageMode: boolean = false): vscode.Task[] {
    let languageMode;

    if (false === ignoreLanguageMode) {
      const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

      if (!editor) {
        return [];
      }

      const fileDirName = path.dirname(editor.document.fileName);
      languageMode = getLanguageMode(fileDirName);
    } else {
      languageMode = LanguageMode.c;
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
}
