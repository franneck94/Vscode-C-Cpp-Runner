import * as vscode from 'vscode';

import { SettingsProvider } from '../provider/settingsProvider';
import { Architectures, Builds } from '../utils/types';

export async function modeHandler(settingsProvider: SettingsProvider) {
  let combinations = [
    `${Builds.debug} - ${Architectures.x86}`,
    `${Builds.debug} - ${Architectures.x64}`,
    `${Builds.release} - ${Architectures.x86}`,
    `${Builds.release} - ${Architectures.x64}`,
  ];

  if (settingsProvider) {
    if (settingsProvider.architecure === Architectures.x86) {
      combinations = combinations.filter(
        (comb) => !comb.includes(Architectures.x64),
      );
    } else {
      combinations = combinations.filter(
        (comb) => !comb.includes(Architectures.x86),
      );
    }
  }

  const pickedCombination = await vscode.window.showQuickPick(combinations, {
    placeHolder: 'Select a build mode',
  });

  const pickedMode = pickedCombination?.includes(Builds.debug)
    ? Builds.debug
    : Builds.release;
  const pickedArchitecture = pickedCombination?.includes(Architectures.x86)
    ? Architectures.x86
    : Architectures.x64;
  return { pickedMode, pickedArchitecture };
}
