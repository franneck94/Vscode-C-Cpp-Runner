import { Languages } from '../../types/types';
import {
  isCppSourceFile,
  isCSourceFile,
  isCudaSourceFile,
} from '../../utils/fileUtils';

export function getFileArgs(
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

export function isNonMatchingSourceFile(
  language: Languages,
  fileExtension: string,
) {
  if (language === Languages.c && !isCSourceFile(fileExtension)) {
    return true;
  }

  if (language === Languages.cpp && !isCppSourceFile(fileExtension)) {
    return true;
  }

  if (language === Languages.cuda && !isCudaSourceFile(fileExtension)) {
    return true;
  }

  return false;
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
