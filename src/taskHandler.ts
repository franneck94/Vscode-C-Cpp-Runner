import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { isSourceFile, pathExists, Tasks } from "./utils";

export async function taskHandler(taskProvider: TaskProvider) {
  try {
    let provideSingleTasks = false;
    let provideBuildFolderTasks = false;
    const editor = vscode.window.activeTextEditor;

    if (undefined === editor || undefined === taskProvider.tasks) {
      throw TypeError("No tasks provided.");
    }

    const fileExt = path.extname(editor.document.fileName);

    if (fileExt && isSourceFile(fileExt)) {
      provideSingleTasks = true;
    }

    // TODO
    const workspaceFolder = taskProvider.propertiesProvider.workspacePath;
    const buildFolder = path.join(workspaceFolder, "build");
    if (pathExists(buildFolder)) {
      provideBuildFolderTasks = true;
    }

    let taskNames: string[] = [];
    taskProvider.tasks.forEach((task) => {
      taskNames.push(task.name);
    });

    if (!provideSingleTasks) {
      taskNames = taskNames.filter((name) => !name.includes(Tasks.buildSingle));
    }

    if (!provideBuildFolderTasks) {
      taskNames = taskNames.filter(
        (name) => !(name.includes(Tasks.run) || name.includes(Tasks.clean))
      );
    }

    const pickedTaskName = await vscode.window.showQuickPick(taskNames);
    if (pickedTaskName) {
      taskProvider.tasks.forEach(async (task) => {
        if (pickedTaskName === task.name) {
          await vscode.tasks.executeTask(task);
        }
      });
    }
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }
}
