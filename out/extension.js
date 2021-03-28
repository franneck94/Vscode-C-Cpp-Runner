"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const commands_1 = require("./commands");
const settingsProvider_1 = require("./settingsProvider");
const propertiesProvider_1 = require("./propertiesProvider");
const extensionName = 'C_Cpp_Runner';
let taskProvider;
let disposableCustomTaskProvider;
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length > 1) {
        return;
    }
    const settingsProvider = new settingsProvider_1.SettingsProvider();
    const workspacePath = workspace[0].uri.fsPath;
    const propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath);
    taskProvider = new taskProvider_1.TaskProvider(settingsProvider);
    disposableCustomTaskProvider = vscode.tasks.registerTaskProvider(extensionName, taskProvider);
    context.subscriptions.push(disposableCustomTaskProvider);
    context.subscriptions.push(vscode.commands.registerCommand(`${extensionName}.run`, () => commands_1.commandHandler(taskProvider)));
    vscode.workspace.onDidChangeConfiguration(() => {
        taskProvider.settingsProvider.getSettings();
        taskProvider.getTasks(true);
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