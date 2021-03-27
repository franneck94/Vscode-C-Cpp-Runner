import * as fs from 'fs';
import { platform } from 'os';
import { lookpath } from 'lookpath';

export function pathExists(path: string): boolean {
    try {
        fs.accessSync(path);
    } catch (err) {
        return false;
    }

    return true;
}

export function getPlattformCategory() {
    const plattformName = platform();
    let plattformCategory: string;

    if (plattformName === 'win32' || plattformName === 'cygwin') {
        plattformCategory = 'win32';
    }
    else if (plattformName === 'darwin') {
        plattformCategory = 'macos';
    }
    else {
        plattformCategory = 'linux';
    }

    return plattformCategory;
}

export function commandExists(command: string) {
    const path = lookpath(command).then();

    if (path === undefined) {
        return false;
    }

    return true;
}

export function isSourceFile(fileExt: string) {
    const fileExtLower: string = fileExt.toLowerCase();
    const isHeader: boolean = !fileExt || [
      ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
    ].some(ext => fileExtLower === ext);
    if (isHeader) {
      return false;
    }

    let fileIsCpp: boolean;
    let fileIsC: boolean;
    if (fileExt === ".C") {
      fileIsCpp = true;
      fileIsC = true;
    } else {
      fileIsCpp = [
        ".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"
      ].some(ext => fileExtLower === ext);
      fileIsC = fileExtLower === ".c";
    }
    if (!(fileIsCpp || fileIsC)) {
      return false;
    }

    return true;
  }
