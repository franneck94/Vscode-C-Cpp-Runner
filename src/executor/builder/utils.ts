import { Languages } from '../../types/enums';
import {
  isCppSourceFile,
  isCSourceFile,
  isCudaSourceFile,
} from '../../utils/fileUtils';

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
