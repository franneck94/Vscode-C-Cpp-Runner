import * as fs from 'fs';

import { env } from 'vscode';

export function formatDate(date: Date): string {
    return date.toLocaleString(env.language);
}

export function pathExists(path: string): boolean {
    try {
        fs.accessSync(path);
    } catch (err) {
        return false;
    }

    return true;
}
