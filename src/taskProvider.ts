import * as path from "path";
import * as vscode from "vscode";

import { PropertiesProvider } from "./propertiesProvider";
import { SettingsProvider } from "./settingsProvider";
import {
  Architectures,
  Builds,
  getLanguage,
  InnerTasksInterface,
  Languages,
  readJsonFile,
  replaceBackslashes,
  Tasks,
  TasksInterface,
} from "./utils";

const EXTENSION_NAME = "C_Cpp_Runner";

export class TaskProvider implements vscode.TaskProvider {
  public tasks: vscode.Task[] | undefined;
  public tasksFile: string;
  public makefileFile: string;

  constructor(
    public settingsProvider: SettingsProvider,
    public propertiesProvider: PropertiesProvider,
    public pickedFolder: string,
    public buildMode: Builds,
    public architectureMode: Architectures
  ) {
    const extDirectory = path.dirname(__dirname);
    const templateDirectory = path.join(extDirectory, "src", "templates");
    this.tasksFile = path.join(templateDirectory, "tasks_template.json");
    this.makefileFile = path.join(templateDirectory, "Makefile");
    if (!this.pickedFolder) {
      this.pickedFolder = this.propertiesProvider.workspaceFolder;
    }

    this.getTasks();
  }

  public async resolveTask(task: vscode.Task) {
    return task;
  }

  public provideTasks(): vscode.Task[] {
    return this.getTasks();
  }

  public getTasks(): vscode.Task[] {
    const language = getLanguage(this.pickedFolder);

    this.setTasksDefinition(language);

    if (!this.tasks) {
      return [];
    }

    return this.tasks;
  }

  private setTasksDefinition(language: Languages) {
    const configJson: TasksInterface = readJsonFile(this.tasksFile);

    if (!configJson) {
      return [];
    }

    this.tasks = [];

    for (const taskJson of configJson.tasks) {
      if (taskJson.type !== "shell") {
        continue;
      }
      if (undefined !== taskJson.options) {
        if (taskJson.options.hide) {
          continue;
        }
      }

      this.updateTaskBasedOnSettings(taskJson, language);

      const shellCommand = `${taskJson.command} ${taskJson.args.join(" ")}`;

      const definition = {
        type: "shell",
        task: taskJson.label,
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

  private updateTaskBasedOnSettings(
    taskJson: InnerTasksInterface,
    language: Languages
  ) {
    const settings = this.settingsProvider;
    const pickedFolder = this.pickedFolder;
    const workspaceFolder = this.propertiesProvider.workspaceFolder;
    const folder = pickedFolder.replace(
      workspaceFolder,
      path.basename(workspaceFolder)
    );
    taskJson.label = taskJson.label.replace(
      taskJson.label.split(": ")[1],
      folder
    );
    taskJson.label = replaceBackslashes(taskJson.label);
    taskJson.args[1] = `--file=${this.makefileFile}`;
    taskJson.args.push(`COMPILATION_MODE=${this.buildMode}`);
    taskJson.args.push(`EXECUTABLE_NAME=out${this.buildMode}`);
    taskJson.args.push(`LANGUAGE_MODE=${language}`);
    const includesClean = taskJson.label.includes(Tasks.clean);
    const includesRun = taskJson.label.includes(Tasks.run);
    if (!includesClean && !includesRun) {
      taskJson.args.push(`ENABLE_WARNINGS=${+settings.enableWarnings}`);
      taskJson.args.push(`WARNINGS="${settings.warnings}"`);
      taskJson.args.push(`WARNINGS_AS_ERRORS=${+settings.warningsAsError}`);
      if (language === Languages.c) {
        taskJson.args.push(`C_COMPILER=${settings.compilerPathC}`);
        taskJson.args.push(`C_STANDARD=${settings.standardC}`);
      } else {
        taskJson.args.push(`CPP_COMPILER=${settings.compilerPathCpp}`);
        taskJson.args.push(`CPP_STANDARD=${settings.standardCpp}`);
      }
      if (settings.compilerArgs) {
        taskJson.args.push(`COMPILER_ARGS=${settings.compilerArgs}`);
      }
      if (settings.linkerArgs) {
        taskJson.args.push(`LINKER_ARGS=${settings.linkerArgs}`);
      }
      if (settings.includePaths) {
        taskJson.args.push(`INCLUDE_PATHS=${settings.includePaths}`);
      }
      const architectureStr =
        this.architectureMode === Architectures.x64 ? "64" : "32";
      taskJson.args.push(`ARCHITECTURE=${architectureStr}`);
    }
    taskJson.command = settings.makePath;
  }
}
