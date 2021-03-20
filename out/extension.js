"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const path = require("path");
const tasksView_1 = require("./tasksView");
const tasksRepository_1 = require("./tasksRepository");
const tasksProvider_1 = require("./tasksProvider");
const utils_1 = require("./utils");
function activate(context) {
    const workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length > 1) {
        vscode.commands.executeCommand('setContext', 'tasksView:showView', false);
    }
    else {
        const tasksFile = path.join(workspace[0].uri.fsPath, '.vscode', 'tasks.json');
        const setContext = () => {
            vscode.commands.executeCommand('setContext', 'tasksView:showView', utils_1.pathExists(tasksFile));
        };
        vscode.window.onDidChangeActiveTextEditor(setContext, null, context.subscriptions);
        setContext();
        if (utils_1.pathExists(tasksFile)) {
            vscode.commands.executeCommand('setContext', 'tasksView:showView', true);
            initWorkspace(context, workspace[0].uri);
        }
        else {
            vscode.commands.executeCommand('setContext', 'tasksView:showView', false);
        }
    }
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function initWorkspace(context, workspaceUri) {
    const tasksRepository = new tasksRepository_1.TasksRepository(workspaceUri);
    const tasksProvider = new tasksProvider_1.TasksProvider(tasksRepository);
    const taskView = new tasksView_1.TaskView(tasksRepository, tasksProvider);
    const treeProvider = vscode.window.registerTreeDataProvider('TasksView', tasksProvider);
    const commandRefreshTasks = vscode.commands.registerCommand('TasksView.refreshTasks', () => {
        taskView.refreshTasks();
    });
    const commandRunTask = vscode.commands.registerCommand('TasksView.runTask', (element) => {
        taskView.runTask(element);
    });
    context.subscriptions.push(treeProvider);
    context.subscriptions.push(commandRefreshTasks);
    context.subscriptions.push(commandRunTask);
}
//# sourceMappingURL=extension.js.map