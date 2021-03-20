"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const vscode = require("vscode");
const vscode_1 = require("vscode");
class Task extends vscode.TreeItem {
    constructor(_label, _args, _command, _type) {
        super(_label, vscode_1.TreeItemCollapsibleState.Collapsed);
        this._label = _label;
        this._args = _args;
        this._command = _command;
        this._type = _type;
        this._label = _label;
        this._args = _args;
        this._command = _command;
        this._type = _type;
    }
}
exports.Task = Task;
//# sourceMappingURL=tasks.js.map