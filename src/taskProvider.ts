import * as path from "path";
import * as vscode from "vscode";

import { PropertiesProvider } from "./propertiesProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  getLanguageFromEditor,
  Languages,
  readJsonFile,
  TasksInterface
} from "./utils";

const EXTENSION_NAME = "C_Cpp_Runner";

export class TaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;

  constructor(
    public settingsProvider: SettingsProvider,
    public propertiesProvider: PropertiesProvider
  ) {
    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, "src", "templates");
    this.tasksFile = path.join(templateDirectory, "tasks_template.json");
    this.makefileFile = path.join(templateDirectory, "Makefile");

    this.getTasks();
  }

  public async resolveTask(task: vscode.Task) {
    return task;
  }

  public provideTasks(): vscode.Task[] {
    return this.getTasks();
  }

  public getTasks(ignoreLanguage: boolean = false): vscode.Task[] {
    const editor = vscode.window.activeTextEditor;
    let language;
    if (!ignoreLanguage) {
      language = getLanguageFromEditor(
        editor,
        this.propertiesProvider.workspacePath
      );
    } else {
      language = Languages.c;
    }

    const configJson: TasksInterface = readJsonFile(this.tasksFile);

    if (undefined === configJson) {
      return [];
    }

    this.tasks = [];

    for (const taskJson of configJson.tasks) {
      if (taskJson.type !== "shell") {
        continue;
      }
      if (undefined !== taskJson.options) {
        if (taskJson.options.hide === true) {
          continue;
        }
      }

      this.updateTaskBasedOnSettings(taskJson, language);

      const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;

      const definition = {
        type: "shell",
        task: taskJson.label
      };
      const problemMatcher = "$gcc";
      const scope = vscode.TaskScope.Workspace;
      const task = new vscode.Task(
        definition,
        scope,
        taskJson.label,
        EXTENSION_NAME,
        new vscode.ShellExecution(shellCommand),
        problemMatcher
      );
      this.tasks.push(task);
    }

    return this.tasks;
  }

  private updateTaskBasedOnSettings(taskJson: any, language: Languages) {
    taskJson.args[1] = `--file=${this.makefileFile}`;
    taskJson.args.push(
      `ENABLE_WARNINGS=${+this.settingsProvider.enableWarnings}`
    );
    taskJson.args.push(`WARNINGS="${this.settingsProvider.warnings}"`);
    taskJson.args.push(
      `WARNINGS_AS_ERRORS=${+this.settingsProvider.warningsAsError}`
    );
    taskJson.args.push(`C_COMPILER=${this.settingsProvider.compilerPathC}`);
    taskJson.args.push(`CPP_COMPILER=${this.settingsProvider.compilerPathCpp}`);
    taskJson.args.push(`LANGUAGE_MODE=${language}`);
    taskJson.args.push(`C_STANDARD=${this.settingsProvider.standardC}`);
    taskJson.args.push(`CPP_STANDARD=${this.settingsProvider.standardCpp}`);
    if (this.settingsProvider.compilerArgs) {
      taskJson.args.push(`COMPILER_ARGS=${this.settingsProvider.compilerArgs}`);
    }
    if (this.settingsProvider.linkerArgs) {
      taskJson.args.push(`LINKER_ARGS=${this.settingsProvider.linkerArgs}`);
    }
    if (this.settingsProvider.includePaths) {
      taskJson.args.push(`INCLUDE_PATHS=${this.settingsProvider.includePaths}`);
    }
    taskJson.command = this.settingsProvider.makePath;
  }
}
