"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const commands_1 = require("./commands");
const settingsProvider_1 = require("./settingsProvider");
const propertiesProvider_1 = require("./propertiesProvider");
const launchProvider_1 = require("./launchProvider");
const EXTENSION_NAME = "C_Cpp_Runner";
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || 1 !== workspace.length) {
        return;
    }
    const workspacePath = workspace[0].uri.fsPath;
    const settingsProvider = new settingsProvider_1.SettingsProvider(workspacePath);
    const propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath, "properties_template.json", "c_cpp_properties.json");
    let taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider);
    let launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspacePath, "launch_template.json", "launch.json");
    context.subscriptions.push(vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider));
    context.subscriptions.push(vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => commands_1.commandHandler(taskProvider)));
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks(true);
        propertiesProvider.updateFileData();
        launchProvider.updateFileData();
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map