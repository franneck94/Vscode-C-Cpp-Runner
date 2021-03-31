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
exports.getLanguageFromEditor = exports.getLanguage = exports.isCSourceFile = exports.isCppSourceFile = exports.isHeaderFile = exports.isSourceFile = exports.getArchitecture = exports.commandExists = exports.getOperatingSystem = exports.writeJsonFile = exports.readJsonFile = exports.pathExists = exports.Architectures = exports.OperatingSystems = exports.Debuggers = exports.Compilers = exports.Languages = void 0;
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
var Debuggers;
(function (Debuggers) {
    Debuggers["lldb"] = "lldb";
    Debuggers["gdb"] = "gdb";
})(Debuggers = exports.Debuggers || (exports.Debuggers = {}));
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
function pathExists(filePath) {
    try {
        fs.accessSync(filePath);
    }
    catch (err) {
        return false;
    }
    return true;
}
exports.pathExists = pathExists;
function readJsonFile(filePath) {
    let configJson;
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        configJson = JSON.parse(fileContent);
    }
    catch (err) {
        return undefined;
    }
    return configJson;
}
exports.readJsonFile = readJsonFile;
function writeJsonFile(outputFilePath, jsonContent) {
    const jsonString = JSON.stringify(jsonContent, null, 2);
    fs.writeFileSync(outputFilePath, jsonString);
}
exports.writeJsonFile = writeJsonFile;
function getOperatingSystem() {
    const plattformName = os_1.platform();
    let operatingSystem;
    if ("win32" === plattformName || "cygwin" === plattformName) {
        operatingSystem = OperatingSystems.windows;
    }
    else if ("darwin" === plattformName) {
        operatingSystem = OperatingSystems.mac;
    }
    else {
        operatingSystem = OperatingSystems.linux;
    }
    return operatingSystem;
}
exports.getOperatingSystem = getOperatingSystem;
function commandExists(command) {
    return __awaiter(this, void 0, void 0, function* () {
        let commandPath = yield lookpath_1.lookpath(command);
        if (undefined === commandPath) {
            return { found: false, path: commandPath };
        }
        if (commandPath.includes(".EXE")) {
            commandPath = commandPath.replace(".EXE", ".exe");
        }
        return { found: true, path: commandPath };
    });
}
exports.commandExists = commandExists;
function getArchitecture(compiler) {
    let command = `${compiler} -dumpmachine`;
    try {
        let byteArray = child_process_1.execSync(command);
        let str = String.fromCharCode(...byteArray);
        if (str.includes("64")) {
            return Architectures.x64;
        }
        else {
            return Architectures.x86;
        }
    }
    catch (err) {
        return Architectures.x86;
    }
}
exports.getArchitecture = getArchitecture;
function isSourceFile(fileExt) {
    const fileExtLower = fileExt.toLowerCase();
    if (isHeaderFile(fileExtLower)) {
        return false;
    }
    if (!(isCSourceFile(fileExtLower) || isCppSourceFile(fileExtLower))) {
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
function getLanguageFromEditor(editor, filePath) {
    let language;
    if (!editor) {
        language = getLanguage(filePath);
    }
    else {
        if (".vscode" !== path.dirname(editor.document.fileName)) {
            const fileDirName = path.dirname(editor.document.fileName);
            language = getLanguage(fileDirName);
        }
        language = getLanguage(filePath);
    }
    return language;
}
exports.getLanguageFromEditor = getLanguageFromEditor;
//# sourceMappingURL=utils.js.map