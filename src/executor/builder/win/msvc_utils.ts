export function gatherIncludeDirsMsvc(includePaths: string[]) {
  let args = '';

  if (includePaths && includePaths.length > 0) {
    for (const includePath of includePaths) {
      if (includePath.includes('$(default)')) continue;

      const hasSpace = includePath.includes(' ');

      if (hasSpace) {
        args += ` /I"${includePath}"`;
      } else {
        args += ` /I${includePath}`;
      }
    }
  }

  return args;
}
