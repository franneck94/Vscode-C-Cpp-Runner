import * as fs from 'fs';
import { platform } from 'os';

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
