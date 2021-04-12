import { execSync } from 'child_process';
import { lookpath } from 'lookpath';
import { platform } from 'os';

import { Architectures, Compilers, OperatingSystems } from './types';

export async function commandExists(command: string) {
  let commandPath = await lookpath(command);

  if (!commandPath) {
    return { f: false, p: commandPath };
  }

  if (commandPath.includes('.EXE')) {
    commandPath = commandPath.replace('.EXE', '.exe');
  }

  return { f: true, p: commandPath };
}

export function getOperatingSystem() {
  const plattformName = platform();
  let operatingSystem: OperatingSystems;

  if (plattformName === 'win32' || plattformName === 'cygwin') {
    operatingSystem = OperatingSystems.windows;
  } else if (plattformName === 'darwin') {
    operatingSystem = OperatingSystems.mac;
  } else {
    operatingSystem = OperatingSystems.linux;
  }

  return operatingSystem;
}

export function getArchitecture(compiler: Compilers) {
  const command = `${compiler} -dumpmachine`;

  try {
    const byteArray = execSync(command);
    const str = String.fromCharCode(...byteArray);

    if (str.includes('64')) {
      return Architectures.x64;
    } else {
      return Architectures.x86;
    }
  } catch (err) {
    return Architectures.x86;
  }
}