"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSourceFile = exports.commandExists = exports.getPlattformCategory = exports.pathExists = void 0;
const fs = require("fs");
const os_1 = require("os");
const lookpath_1 = require("lookpath");
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
function commandExists(command) {
    const path = lookpath_1.lookpath(command).then();
    if (path === undefined) {
        return false;
    }
    return true;
}
exports.commandExists = commandExists;
function isSourceFile(fileExt) {
    const fileExtLower = fileExt.toLowerCase();
    const isHeader = !fileExt || [
        ".hpp", ".hh", ".hxx", ".h++", ".hp", ".h", ".ii", ".inl", ".idl", ""
    ].some(ext => fileExtLower === ext);
    if (isHeader) {
        return false;
    }
    let fileIsCpp;
    let fileIsC;
    if (fileExt === ".C") {
        fileIsCpp = true;
        fileIsC = true;
    }
    else {
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
exports.isSourceFile = isSourceFile;
//# sourceMappingURL=utils.js.map