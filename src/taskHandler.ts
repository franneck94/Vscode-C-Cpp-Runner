import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { pathExists, Tasks } from "./utils";

export async function taskHandler(taskProvider: TaskProvider) {
  let provideBuildFolderTasks = false;

  if (!taskProvider.tasks) {
    return;
  }

  const tasks: vscode.Task[] = taskProvider.tasks;

  const projectFolder = taskProvider.getProjectFolder();
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
        await vscode.tasks.executeTask(task);
      }
    });
  }
}
