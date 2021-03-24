"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstalledBinaryPlatform = exports.checkFileExistsSync = exports.setExtensionPath = void 0;
const path = require("path");
const fs = require("fs");
var extensionPath;
function setExtensionPath(context) {
    extensionPath = context.extensionPath;
}
exports.setExtensionPath = setExtensionPath;
function checkFileExistsSync(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (e) {
    }
    return false;
}
exports.checkFileExistsSync = checkFileExistsSync;
function getInstalledBinaryPlatform() {
    // the LLVM/bin folder is utilized to identify the platform
    let installedPlatform;
    if (checkFileExistsSync(path.join(extensionPath, "LLVM/bin/clang-format.exe"))) {
        installedPlatform = "win32";
    }
    else if (checkFileExistsSync(path.join(extensionPath, "LLVM/bin/clang-format.darwin"))) {
        installedPlatform = "darwin";
    }
    else if (checkFileExistsSync(path.join(extensionPath, "LLVM/bin/clang-format"))) {
        installedPlatform = "linux";
    }
    else {
        installedPlatform = "error";
    }
    return installedPlatform;
}
exports.getInstalledBinaryPlatform = getInstalledBinaryPlatform;
//# sourceMappingURL=platform.js.map