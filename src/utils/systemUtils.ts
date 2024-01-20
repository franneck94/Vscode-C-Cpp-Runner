import { exec, execSync } from 'child_process';
import { lookpath } from 'lookpath';
import { platform } from 'os';

import { Architectures, OperatingSystems } from '../types/enums';

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
  let architecture = Architectures.x64;
  let isCygwin = false;

  if (
    str.toLowerCase().includes('arm') ||
    str.toLowerCase().includes('aarch')
  ) {
    architecture = Architectures.ARM64;
  } else if (str.includes('64')) {
    architecture = Architectures.x64;
  } else {
    architecture = Architectures.x86;
  }

  if (str.includes('cygwin')) {
    isCygwin = true;
  }

  return { architecture: architecture, isCygwin: isCygwin };
}

interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
}

async function executeCommand(command: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, stderr: stderr || error.message });
      } else {
        resolve({ success: true, stdout: stdout.trim() });
      }
    });
  });
}

export async function checkForCompilerIsValid(command: string) {
  const result = await executeCommand(command);

  return result.success;
}
