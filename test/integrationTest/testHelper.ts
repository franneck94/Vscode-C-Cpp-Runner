import * as vscode from 'vscode';

export const defaultTimeout: number = 100000;

export async function activateCppExtension(): Promise<void> {
  const extension:
    | vscode.Extension<any>
    | undefined = vscode.extensions.getExtension('franneck94.c-cpp-runner');
  if (extension && !extension.isActive) {
    await extension.activate();
  }
}
export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
