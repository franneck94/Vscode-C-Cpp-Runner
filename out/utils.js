"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathExists = void 0;
const fs = require("fs");
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