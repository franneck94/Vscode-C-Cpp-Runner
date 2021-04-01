import { basename } from 'path';
import * as vscode from 'vscode';

export function updateStatus(status: vscode.StatusBarItem) {
  const info = getEditorInfo();
  status.text = info ? info.text || "" : "";
  status.tooltip = info ? info.tooltip : undefined;

  if (info) {
    status.show();
  } else {
    status.hide();
  }

  return info ? info.workspacePath : "";
}

export function getEditorInfo(): {
  text?: string | undefined;
  tooltip?: string | undefined;
  workspacePath?: string | undefined;
} | null {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace.workspaceFolders;

  if (!editor || !workspace) {
    return null;
  }

  let text: string | undefined;
  let tooltip: string | undefined;
  let workspacePath: string | undefined;

  const resource = editor.document.uri;
  if (resource.scheme === "file") {
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    if (!folder) {
      text = `$(alert) <outside workspace>`;
    } else {
      if (workspace.length > 1) {
        text = `$(file-submodule) ${basename(folder.uri.fsPath)} (${
          folder.index + 1
        } of ${workspace.length})`;
      } else {
        text = `$(file-submodule) ${basename(folder.uri.fsPath)}`;
      }

      tooltip = resource.fsPath;

      workspace.forEach((f) => {
        if (folder.name === f.name) {
          workspacePath = folder.uri.fsPath;
        }
      });
    }
  }

  return { text, tooltip, workspacePath };
}

export async function workspaceHandler() {
  try {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace) {
      return undefined;
    }

    if (workspace.length === 1) {
      return workspace[0].uri.fsPath;
    }

    const workspaceNames: string[] = [];
    workspace.forEach((folder) => {
      workspaceNames.push(folder.name);
    });

    const pickedWorkspaceName = await vscode.window.showQuickPick(
      workspaceNames,
      {
        placeHolder:
          "Select workspace folder to init the C/C++ Runner extension."
      }
    );
    let pickedFolder;

    if (pickedWorkspaceName) {
      workspace.forEach((folder) => {
        if (pickedWorkspaceName === folder.name) {
          pickedFolder = folder.uri.fsPath;
        }
      });
    }

    return pickedFolder;
  } catch (err) {
    vscode.window.showInformationMessage(err);
  }

  return undefined;
}
