import * as path from "path";
import * as vscode from "vscode";

import { TaskProvider } from "./taskProvider";
import { isSourceFile } from "./utils";

export async function commandHandler(taskProvider: TaskProvider) {
  try {
    const editor = vscode.window.activeTextEditor;

    if (undefined === editor || undefined === taskProvider.tasks) {
      throw TypeError("You must open a C/C++ file.");
    }

    const fileExt = path.extname(editor.document.fileName);

    if (!fileExt || !isSourceFile(fileExt)) {
      throw TypeError("You must open a C/C++ file.");
    }

    let taskNames: Array<string> = [];
    taskProvider.tasks.forEach((task) => {
      taskNames.push(task.name);
    });

    const pickedTaskName = await vscode.window.showQuickPick(taskNames);
    if (pickedTaskName) {
      taskProvider.tasks.forEach((task) => {
        if (pickedTaskName === task.name) {
          vscode.tasks.executeTask(task).then();
        }
      });
    }
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }
}
