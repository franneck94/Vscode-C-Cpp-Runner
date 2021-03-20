"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathExists = exports.formatDate = void 0;
const fs = require("fs");
const vscode_1 = require("vscode");
function formatDate(date) {
    return date.toLocaleString(vscode_1.env.language);
}
exports.formatDate = formatDate;
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
//# sourceMappingURL=utils.js.map