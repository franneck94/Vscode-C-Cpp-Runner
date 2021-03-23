"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const commands_1 = require("./commands");
const settings_1 = require("./settings");
let taskProvider;
let disposableCustomTaskProvider;
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length > 1) {
        return;
    }
    const extensionName = 'C_Cpp_Runner';
    const settingsProvider = new settings_1.SettingsProvider();
    taskProvider = new taskProvider_1.TaskProvider(settingsProvider);
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(extensionName, taskProvider);
    context.subscriptions.push(disposableCustomTaskProvider);
    context.subscriptions.push(vscode.commands.registerCommand(`${extensionName}.run`, () => commands_1.commandHandler(taskProvider)));
    vscode.workspace.onDidChangeConfiguration(() => {
        taskProvider.settingsProvider.getSettings();
    });
}
exports.activate = activate;
function deactivate() {
    if (disposableCustomTaskProvider) {
        disposableCustomTaskProvider.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map