import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { Builds, filterOnString, pathExists, Tasks } from "./utils";

export async function taskHandler(taskProvider: TaskProvider) {
  let provideRunTask = false;
  let provideCleanTask = false;
  let provideDebugTask = false;

  if (!taskProvider.tasks) {
    return;
  }

  const tasks: vscode.Task[] = taskProvider.tasks;

  const projectFolder = taskProvider.getProjectFolder();
  const buildFolder = path.join(projectFolder, "build");
  const debugFolder = path.join(buildFolder, Builds.debug);
  const releaseFolder = path.join(buildFolder, Builds.release);
  const currentMode = taskProvider.buildMode;

  if (currentMode === Builds.debug && pathExists(debugFolder)) {
    provideRunTask = true;
    provideCleanTask = true;
  } else if (currentMode === Builds.release && pathExists(releaseFolder)) {
    provideRunTask = true;
    provideCleanTask = true;
  }

  if (pathExists(debugFolder)) {
    provideDebugTask = true;
  }

  let taskNames: string[] = [];
  tasks.forEach((task) => {
    taskNames.push(task.name);
  });

  if (!provideRunTask) {
    taskNames = filterOnString(taskNames, Tasks.run);
  }
  if (!provideCleanTask) {
    taskNames = filterOnString(taskNames, Tasks.clean);
  }
  if (!provideDebugTask) {
    taskNames = filterOnString(taskNames, Tasks.debug);
  }

  const pickedTaskName = await vscode.window.showQuickPick(taskNames);
  if (pickedTaskName) {
    tasks.forEach(async (task) => {
      if (pickedTaskName === task.name) {
        if (task.name.includes("Debug")) {
          taskProvider.runDebugTask();
        } else if (
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
