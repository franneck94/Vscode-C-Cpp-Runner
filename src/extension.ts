import * as vscode from 'vscode';
import * as path from 'path';

import { TaskView } from './tasksView';
import { TasksRepository } from './tasksRepository';
import { TasksProvider } from './tasksProvider';
import { Task } from './tasks';
import { pathExists } from './utils';


export function activate(context: vscode.ExtensionContext) {
    const workspace = vscode.workspace.workspaceFolders;

    if (!workspace || workspace.length > 1) {
        vscode.commands.executeCommand('setContext', 'tasksView:showView', false);
    } 
    else {
        const tasksFile = path.join(
            workspace[0].uri.fsPath,
            '.vscode',
            'tasks.json'
        );

        const setContext = () => {
            vscode.commands.executeCommand('setContext', 'tasksView:showView',
            pathExists(tasksFile));
        };
        vscode.window.onDidChangeActiveTextEditor(setContext, null, context.subscriptions);
        setContext();

        if (pathExists(tasksFile)) {
            vscode.commands.executeCommand('setContext', 'tasksView:showView', true);
            initWorkspace(context, workspace[0].uri);
        }
        else {
            vscode.commands.executeCommand('setContext', 'tasksView:showView', false);
        }
    }
}

export function deactivate() {
}

function initWorkspace(context: vscode.ExtensionContext, workspaceUri: vscode.Uri) {
    const tasksRepository = new TasksRepository(workspaceUri);
    const tasksProvider = new TasksProvider(tasksRepository);
    const taskView = new TaskView(tasksRepository, tasksProvider);

    const treeProvider = vscode.window.registerTreeDataProvider('TasksView', tasksProvider);
    const commandRefreshTasks = vscode.commands.registerCommand('TasksView.refreshTasks', () => {
        taskView.refreshTasks();
    });
    const commandRunTask = vscode.commands.registerCommand('TasksView.runTask', (element: Task) => {
        taskView.runTask(element);
    });

    context.subscriptions.push(treeProvider);
    context.subscriptions.push(commandRefreshTasks);
    context.subscriptions.push(commandRunTask);
}
