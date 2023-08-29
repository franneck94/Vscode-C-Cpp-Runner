import { LOWER_LIMIT_WILDARD_COMPILE } from '../params';

export function mergeUnixCompileFilesStr(
  objectFiles: string[],
  fullFileArgs: string[],
  compiler: string,
  fullCompilerArgs: string,
  appendSymbol: string,
) {
  let commandLine = '';
  let idx = 0;

  if (objectFiles.length < LOWER_LIMIT_WILDARD_COMPILE) {
    for (const fullFileArg of fullFileArgs) {
      if (idx === 0) {
        commandLine += `${compiler} ${fullCompilerArgs} ${fullFileArg}`;
      } else {
        commandLine += ` ${appendSymbol} ${compiler} ${fullCompilerArgs} ${fullFileArg}`;
      }
      idx++;
    }
  }

  return commandLine;
}

export function getUnixObjectFilesStr(objectFiles: string[]) {
  let objectFilesStr: string = '';

  for (const objectfile of objectFiles) {
    if (objectfile.includes(' ')) objectFilesStr += ` "${objectfile}"`;
    else objectFilesStr += ` ${objectfile}`;
  }

  return objectFilesStr;
}
