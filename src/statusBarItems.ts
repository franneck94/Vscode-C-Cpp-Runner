import { basename } from "path";
import * as vscode from "vscode";
import { Architectures, Builds } from "./utils";

export function updateFolderStatus(status: vscode.StatusBarItem) {
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

export function updateModeStatus(
  status: vscode.StatusBarItem,
  buildMode: Builds,
  architectureMode: Architectures
) {
  const info = {
    text: `${buildMode} - ${architectureMode}`,
    tooltip: "tooltip",
  };
  status.text = info.text;
  status.tooltip = info.tooltip;

  if (info) {
    status.show();
  } else {
    status.hide();
  }
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
