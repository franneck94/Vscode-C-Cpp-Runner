"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const commands_1 = require("./commands");
const settingsProvider_1 = require("./settingsProvider");
const propertiesProvider_1 = require("./propertiesProvider");
const launchProvider_1 = require("./launchProvider");
const workspaceHandler_1 = require("./workspaceHandler");
const EXTENSION_NAME = "C_Cpp_Runner";
const PROPERTIES_TEMPLATE = "properties_template.json";
const PROPERTIES_FILE = "c_cpp_properties.json";
const LAUNCH_TEMPLATE = "launch_template.json";
const LAUNCH_FILE = "launch.json";
let taskProviderDisposable;
let commandHandlerDisposable;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspacePath = yield workspaceHandler_1.workspaceHandler();
        context.subscriptions.push(vscode.commands.registerCommand(`${EXTENSION_NAME}.init`, () => __awaiter(this, void 0, void 0, function* () { return workspaceInstance(yield workspaceHandler_1.workspaceHandler(), context); })));
        workspaceInstance(workspacePath, context);
    });
}
exports.activate = activate;
function workspaceInstance(workspacePath, context) {
    if (undefined === workspacePath) {
        return;
    }
    const settingsProvider = new settingsProvider_1.SettingsProvider(workspacePath);
    const propertiesProvider = new propertiesProvider_1.PropertiesProvider(settingsProvider, workspacePath, PROPERTIES_TEMPLATE, PROPERTIES_FILE);
    let taskProvider = new taskProvider_1.TaskProvider(settingsProvider, propertiesProvider);
    let launchProvider = new launchProvider_1.LaunchProvider(settingsProvider, workspacePath, LAUNCH_TEMPLATE, LAUNCH_FILE);
    deactivateDisposables();
    taskProviderDisposable = vscode.tasks.registerTaskProvider(EXTENSION_NAME, taskProvider);
    commandHandlerDisposable = vscode.commands.registerCommand(`${EXTENSION_NAME}.run`, () => commands_1.commandHandler(taskProvider));
    context.subscriptions.push(taskProviderDisposable);
    context.subscriptions.push(commandHandlerDisposable);
    vscode.workspace.onDidChangeConfiguration(() => {
        settingsProvider.getSettings();
        taskProvider.getTasks(true);
        propertiesProvider.updateFileData();
        launchProvider.updateFileData();
    });
}
function deactivateDisposables() {
    if (taskProviderDisposable) {
        taskProviderDisposable.dispose();
    }
    if (commandHandlerDisposable) {
        commandHandlerDisposable.dispose();
    }
}
function deactivate() {
    deactivateDisposables();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map