import * as vscode from 'vscode';

import { Builds } from '../types/enums';

export async function modeHandler() {
  const combinations = [Builds.debug, Builds.release];

  const pickedCombination = await vscode.window.showQuickPick(combinations, {
    placeHolder: 'Select a build mode',
  });

  if (!pickedCombination) return undefined;

  const pickedMode = pickedCombination.includes(Builds.debug)
    ? Builds.debug
    : Builds.release;

  return pickedMode;
}
