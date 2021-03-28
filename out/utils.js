"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguageMode = exports.isCSourceFile = exports.isCppSourceFile = exports.isSourceFile = exports.commandExists = exports.getPlattformCategory = exports.pathExists = exports.LanguageMode = void 0;
const fs = require("fs");
const path = require("path");
const os_1 = require("os");
const lookpath_1 = require("lookpath");
var LanguageMode;
(function (LanguageMode) {
    LanguageMode["c"] = "C";
    LanguageMode["cpp"] = "Cpp";
})(LanguageMode = exports.LanguageMode || (exports.LanguageMode = {}));
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
        plattformCategory = 'windows';
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
    return __awaiter(this, void 0, void 0, function* () {
        const path = yield lookpath_1.lookpath(command);
        if (path === undefined) {
            return { found: false, path: path };
        }
        return { found: true, path: path };
    });
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
    fileIsC = isCSourceFile(fileExtLower);
    fileIsCpp = isCppSourceFile(fileExtLower);
    if (!(fileIsCpp || fileIsC)) {
        return false;
    }
    return true;
}
exports.isSourceFile = isSourceFile;
function isCppSourceFile(fileExtLower) {
    return [
        ".cpp", ".cc", ".cxx", ".c++", ".cp", ".ino", ".ipp", ".tcc"
    ].some(ext => fileExtLower === ext);
}
exports.isCppSourceFile = isCppSourceFile;
function isCSourceFile(fileExtLower) {
    return fileExtLower === '.c';
}
exports.isCSourceFile = isCSourceFile;
function getLanguageMode(fileDirName) {
    let files = fs.readdirSync(fileDirName);
    let anyCppFile = files.some(file => isCppSourceFile(path.extname(file)));
    if (anyCppFile) {
        return LanguageMode.cpp;
    }
    else {
        return LanguageMode.c;
    }
}
exports.getLanguageMode = getLanguageMode;
//# sourceMappingURL=utils.js.map