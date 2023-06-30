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

export function GetWildcardPatterns(files: string[]) {
  const has_cpp = files.some((f: string) => f.endsWith('.cpp'));
  const has_cc = files.some((f: string) => f.endsWith('.cc'));
  const has_cxx = files.some((f: string) => f.endsWith('.cxx'));

  if (has_cpp && !has_cc && !has_cxx) return ' *.cpp';
  if (!has_cpp && has_cc && !has_cxx) return ' *.cc';
  if (!has_cpp && !has_cc && has_cxx) return ' *.cxx';

  if (!has_cpp && has_cc && has_cxx) return ' *.cc *.cxx';
  if (has_cpp && !has_cc && has_cxx) return ' *.cpp *.cxx';
  if (has_cpp && has_cc && !has_cxx) return ' *.cpp *.cc';

  if (has_cpp && has_cc && has_cxx) return ' *.cpp *.cc *.cxx';

  return '';
}
