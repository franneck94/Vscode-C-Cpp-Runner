import { execSync } from 'child_process';
import { lookpath } from 'lookpath';
import { platform } from 'os';

import { Architectures, OperatingSystems } from './types';

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
  const platformName = platform();
  let operatingSystem: OperatingSystems;

  if (platformName === 'win32') {
    operatingSystem = OperatingSystems.windows;
  } else if (platformName === 'darwin') {
    operatingSystem = OperatingSystems.mac;
  } else {
    operatingSystem = OperatingSystems.linux;
  }

  return operatingSystem;
}

export function getCompilerArchitecture(compiler: string) {
  const command = `${compiler} -dumpmachine`;
  let byteArray: Buffer | undefined;

  try {
    byteArray = execSync(command);
  } catch (err) {
    byteArray = Buffer.from('x64', 'utf-8');
  }

  const str = String.fromCharCode(...byteArray);
  let architecure = Architectures.x86;
  let isCygwin = false;

  if (str.includes('64')) {
    architecure = Architectures.x64;
  }

  if (str.includes('cygwin')) {
    isCygwin = true;
  }

  return { architecure: architecure, isCygwin: isCygwin };
}
