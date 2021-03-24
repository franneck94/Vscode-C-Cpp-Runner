"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlattformCategory = exports.pathExists = void 0;
const fs = require("fs");
const os_1 = require("os");
function pathExists(path) {
    try {
        fs.accessSync(path);
    }
    catch (err) {
        return false;
    }
    return true;
}
exports.pathExists = pathExists;
function getPlattformCategory() {
    const plattformName = os_1.platform();
    let plattformCategory;
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
exports.getPlattformCategory = getPlattformCategory;
//# sourceMappingURL=utils.js.map