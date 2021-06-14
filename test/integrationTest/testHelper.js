"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.activateCppExtension = exports.defaultTimeout = void 0;
const vscode = require("vscode");
exports.defaultTimeout = 100000;
async function activateCppExtension() {
    const extension = vscode.extensions.getExtension('franneck94.c-cpp-runner');
    if (extension && !extension.isActive) {
        await extension.activate();
    }
}
exports.activateCppExtension = activateCppExtension;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
//# sourceMappingURL=testHelper.js.map