"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const customTaskProvider_1 = require("./customTaskProvider");
let customTaskProvider;
let disposableCustomTaskProvider;
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length > 1) {
        return;
    }
    customTaskProvider = new customTaskProvider_1.CustomBuildTaskProvider();
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider('Runner.run', customTaskProvider);
    context.subscriptions.push(disposableCustomTaskProvider);
}
exports.activate = activate;
function deactivate() {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map