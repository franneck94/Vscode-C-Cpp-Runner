import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { isSourceFile } from "./utils";

export async function commandHandler(taskProvider: TaskProvider) {
  try {
    let provideSingleTasks = false;
    const editor = vscode.window.activeTextEditor;

    if (undefined === editor || undefined === taskProvider.tasks) {
      throw TypeError("No tasks provided.");
    }

    const fileExt = path.extname(editor.document.fileName);

    if (fileExt && isSourceFile(fileExt)) {
      provideSingleTasks = true;
    }

    let taskNames: Array<string> = [];
    taskProvider.tasks.forEach((task) => {
      taskNames.push(task.name);
    });

    if (false === provideSingleTasks) {
      taskNames = taskNames.filter(
        (name) => !name.toLowerCase().includes("single")
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
