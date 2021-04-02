import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { pathExists, Tasks } from "./utils";

export async function taskHandler(taskProvider: TaskProvider) {
  try {
    let provideBuildFolderTasks = false;
    const editor = vscode.window.activeTextEditor;

    if (undefined === editor || undefined === taskProvider.tasks) {
      throw TypeError("No tasks provided.");
    }

    const tasks: vscode.Task[] = taskProvider.tasks;

    let projectFolder = "";
    if (taskProvider.pickedFolder !== undefined) {
      projectFolder = taskProvider.pickedFolder;
    } else {
      projectFolder = taskProvider.propertiesProvider.workspacePath;
    }
    const buildFolder = path.join(projectFolder, "build");
    if (pathExists(buildFolder)) {
      provideBuildFolderTasks = true;
    }

    let taskNames: string[] = [];
    tasks.forEach((task) => {
      taskNames.push(task.name);
    });

    if (!provideBuildFolderTasks) {
      taskNames = taskNames.filter(
        (name) => !(name.includes(Tasks.run) || name.includes(Tasks.clean))
      );
    }

    const pickedTaskName = await vscode.window.showQuickPick(taskNames);
    if (pickedTaskName) {
      tasks.forEach(async (task) => {
        if (pickedTaskName === task.name) {
          if (projectFolder !== "") {
            if (
              task.execution &&
              task.execution instanceof vscode.ShellExecution &&
              task.execution.commandLine
            ) {
              task.execution.commandLine = task.execution.commandLine.replace(
                "FILE_DIR",
                projectFolder
              );
            }
          } else {
            if (
              task.execution &&
              task.execution instanceof vscode.ShellExecution &&
              task.execution.commandLine
            ) {
              task.execution.commandLine = task.execution.commandLine.replace(
                "FILE_DIR",
                "${fileDirname}/"
              );
            }
          }
          await vscode.tasks.executeTask(task);
        }
      });
    }
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }
}
