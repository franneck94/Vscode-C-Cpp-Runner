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
exports.getLanguage = exports.isCSourceFile = exports.isCppSourceFile = exports.isHeaderFile = exports.isSourceFile = exports.getArchitecture = exports.commandExists = exports.getPlattformCategory = exports.readJsonFile = exports.pathExists = exports.Architectures = exports.OperatingSystems = exports.Compilers = exports.Languages = void 0;
const fs = require("fs");
const path = require("path");
const os_1 = require("os");
const lookpath_1 = require("lookpath");
const child_process_1 = require("child_process");
var Languages;
(function (Languages) {
    Languages["c"] = "C";
    Languages["cpp"] = "Cpp";
})(Languages = exports.Languages || (exports.Languages = {}));
var Compilers;
(function (Compilers) {
    Compilers["gcc"] = "gcc";
    Compilers["gpp"] = "g++";
    Compilers["clang"] = "clang";
    Compilers["clangpp"] = "clang++";
})(Compilers = exports.Compilers || (exports.Compilers = {}));
var OperatingSystems;
(function (OperatingSystems) {
    OperatingSystems["windows"] = "windows";
    OperatingSystems["linux"] = "linux";
    OperatingSystems["mac"] = "macos";
})(OperatingSystems = exports.OperatingSystems || (exports.OperatingSystems = {}));
var Architectures;
(function (Architectures) {
    Architectures["x86"] = "x86";
    Architectures["x64"] = "x64";
})(Architectures = exports.Architectures || (exports.Architectures = {}));
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
function readJsonFile(path) {
    let configJson;
    try {
        const fileContent = fs.readFileSync(path, "utf-8");
        configJson = JSON.parse(fileContent);
    }
    catch (err) {
        return;
    }
    if (!configJson.configurations) {
        return;
    }
    return configJson;
}
exports.readJsonFile = readJsonFile;
function getPlattformCategory() {
    const plattformName = os_1.platform();
    let plattformCategory;
    if ("win32" === plattformName || "cygwin" === plattformName) {
        plattformCategory = OperatingSystems.windows;
    }
    else if ("darwin" === plattformName) {
        plattformCategory = OperatingSystems.mac;
    }
    else {
        plattformCategory = OperatingSystems.linux;
    }
    return plattformCategory;
}
exports.getPlattformCategory = getPlattformCategory;
function commandExists(command) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = yield lookpath_1.lookpath(command);
        if (undefined === path) {
            return { found: false, path: path };
        }
        return { found: true, path: path };
    });
}
exports.commandExists = commandExists;
function getArchitecture(compiler) {
    let command = `${compiler} -dumpmachine`;
    let byteArray = child_process_1.execSync(command);
    let str = String.fromCharCode(...byteArray);
    if (str.includes("64")) {
        return Architectures.x64;
    }
    else {
        return Architectures.x86;
    }
}
exports.getArchitecture = getArchitecture;
function isSourceFile(fileExt) {
    const fileExtLower = fileExt.toLowerCase();
    const isHeader = isHeaderFile(fileExtLower);
    if (isHeader) {
        return false;
    }
    let fileIsC = isCSourceFile(fileExtLower);
    let fileIsCpp = isCppSourceFile(fileExtLower);
    if (!(fileIsCpp || fileIsC)) {
        return false;
    }
    return true;
}
exports.isSourceFile = isSourceFile;
function isHeaderFile(fileExtLower) {
    return [".hpp", ".hh", ".hxx", ".h"].some((ext) => fileExtLower === ext);
}
exports.isHeaderFile = isHeaderFile;
function isCppSourceFile(fileExtLower) {
    return [".cpp", ".cc", ".cxx"].some((ext) => fileExtLower === ext);
}
exports.isCppSourceFile = isCppSourceFile;
function isCSourceFile(fileExtLower) {
    return ".c" === fileExtLower;
}
exports.isCSourceFile = isCSourceFile;
function getLanguage(fileDirName) {
    let files = fs.readdirSync(fileDirName);
    let anyCppFile = files.some((file) => isCppSourceFile(path.extname(file)));
    if (anyCppFile) {
        return Languages.cpp;
    }
    else {
        return Languages.c;
    }
}
exports.getLanguage = getLanguage;
//# sourceMappingURL=utils.js.map