"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const commands_1 = require("./commands");
const settingsProvider_1 = require("./settingsProvider");
const propertiesProvider_1 = require("./propertiesProvider");
const EXTENSION_NAME = "C_Cpp_Runner";
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length !== 1) {
        return;
    }
    const workspacePath = workspace[0].uri.fsPath;
    const settingsProvider = new settingsProvider_1.SettingsProvider(workspacePath);
    const propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath);
    let taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider);
    context.subscriptions.push(vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider));
    context.subscriptions.push(vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => commands_1.commandHandler(taskProvider)));
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks(true);
        propertiesProvider.updateProperties(settingsProvider);
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map