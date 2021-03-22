"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const customTaskProvider_1 = require("./customTaskProvider");
const commands_1 = require("./commands");
let customTaskProvider;
let disposableCustomTaskProvider;
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length > 1) {
        return;
    }
    const extensionName = 'C_Cpp_Runner';
    customTaskProvider = new customTaskProvider_1.CppBuildTaskProvider();
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(extensionName, customTaskProvider);
    context.subscriptions.push(disposableCustomTaskProvider);
    context.subscriptions.push(vscode.commands.registerCommand(`${extensionName}.run`, (customTaskProvider.tasks), commands_1.commandHandler(customTaskProvider.tasks)));
}
exports.activate = activate;
function deactivate() {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map