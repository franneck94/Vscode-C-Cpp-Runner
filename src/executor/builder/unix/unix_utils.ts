import { LOWER_LIMIT_WILDARD_COMPILE } from '../../../params/params';

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

export function gatherIncludeDirsUnix(includePaths: string[]) {
  let args = '';

  if (includePaths && includePaths.length > 0) {
    for (const includePath of includePaths) {
      if (includePath.includes('$(default)')) continue;

      const hasSpace = includePath.includes(' ');

      if (hasSpace) {
        args += ` -I"${includePath}"`;
      } else {
        args += ` -I${includePath}`;
      }
    }
  }

  return args;
}

export function getUnixFileArgs(
  file: string,
  ltoFlag: string,
  objectFilePath: string,
) {
  const hasSpace = file.includes(' ');
  const hasAmpersand = file.includes('&');

  if (hasSpace || hasAmpersand)
    return `${ltoFlag} -c '${file}' -o '${objectFilePath}'`;

  return `${ltoFlag} -c ${file} -o ${objectFilePath}`;
}
