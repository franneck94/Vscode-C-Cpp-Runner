"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tasks = exports.Builds = exports.Architectures = exports.OperatingSystems = exports.Debuggers = exports.Compilers = exports.Languages = exports.Task = void 0;
const vscode = require("vscode");
class Task extends vscode.Task {
}
exports.Task = Task;
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
var Builds;
(function (Builds) {
    Builds["debug"] = "Debug";
    Builds["release"] = "Release";
})(Builds = exports.Builds || (exports.Builds = {}));
var Tasks;
(function (Tasks) {
    Tasks["build"] = "Build";
    Tasks["run"] = "Run";
    Tasks["clean"] = "Clean";
    Tasks["debug"] = "Debug";
})(Tasks = exports.Tasks || (exports.Tasks = {}));
//# sourceMappingURL=types.js.map