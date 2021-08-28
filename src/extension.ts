import * as path from 'path';
import * as vscode from 'vscode';

import { executeBuildTask } from './executor/builder';
import { runDebugger } from './executor/debugger';
import { executeRunTask } from './executor/runner';
import { folderHandler } from './handler/folderHandler';
import { modeHandler } from './handler/modeHandler';
import {
	updateBuildStatus,
	updateCleanStatus,
	updateDebugStatus,
	updateFolderStatus,
	updateModeStatus,
	updateRunStatus,
} from './items/statusBarItems';
import { LaunchProvider } from './provider/launchProvider';
import { PropertiesProvider } from './provider/propertiesProvider';
import { SettingsProvider } from './provider/settingsProvider';
import { TaskProvider } from './provider/taskProvider';
import {
	foldersInDir,
	mkdirRecursive,
	pathExists,
	replaceBackslashes,
	rmdirRecursive,
} from './utils/fileUtils';
import * as logger from './utils/logger';
import { Builds } from './utils/types';
import {
	createStatusBarItem,
	disposeItem,
	getExperimentalExecutionState,
	getLoggingState,
	isCmakeActive,
	isMakeActive,
	setContextValue,
	updateLoggingState,
} from './utils/vscodeUtils';

let folderContextMenuDisposable: vscode.Disposable | undefined;
let taskProviderDisposable: vscode.Disposable | undefined;
let commandHandlerDisposable: vscode.Disposable | undefined;
let toggleStatusBarDisposable: vscode.Disposable | undefined;
let commandFolderDisposable: vscode.Disposable | undefined;
let commandModeDisposable: vscode.Disposable | undefined;
let commandBuildDisposable: vscode.Disposable | undefined;
let commandRunDisposable: vscode.Disposable | undefined;
let commandDebugDisposable: vscode.Disposable | undefined;
let commandCleanDisposable: vscode.Disposable | undefined;
let commandArgumentParser: vscode.Disposable | undefined;
let eventConfigurationDisposable: vscode.Disposable | undefined;
let eventRenameFilesDisposable: vscode.Disposable | undefined;
let eventDeleteFilesDisposable: vscode.Disposable | undefined;

let settingsProvider: SettingsProvider | undefined;
let launchProvider: LaunchProvider | undefined;
let propertiesProvider: PropertiesProvider | undefined;
let taskProvider: TaskProvider | undefined;

let folderStatusBar: vscode.StatusBarItem | undefined;
let modeStatusBar: vscode.StatusBarItem | undefined;
let buildStatusBar: vscode.StatusBarItem | undefined;
let runStatusBar: vscode.StatusBarItem | undefined;
let debugStatusBar: vscode.StatusBarItem | undefined;
let cleanStatusBar: vscode.StatusBarItem | undefined;
let argumentsString: string | undefined;

let workspaceFolder: string | undefined;
let activeFolder: string | undefined;
let buildMode: Builds = Builds.debug;
let showStatusBarItems: boolean = true;

const EXTENSION_NAME = 'C_Cpp_Runner';

export let extensionContext: vscode.ExtensionContext | undefined;
export let extensionState: vscode.Memento | undefined;
export let extensionPath: string | undefined;
export let loggingActive: boolean = false;
export let experimentalExecutionEnabled: boolean = false;

export function activate(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    return;
  }

  extensionContext = context;
  extensionPath = context.extensionPath;
  extensionState = context.workspaceState;
  updateLoggingState();
  loggingActive = getLoggingState();
  experimentalExecutionEnabled = getExperimentalExecutionState();

  if (vscode.workspace.workspaceFolders.length === 1) {
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  setContextValue(`${EXTENSION_NAME}:activatedExtension`, true);

  const cmakeActive = isCmakeActive();
  if (cmakeActive) {
    showStatusBarItems = false;
    const infoMessage = `CMake Project found. UI disabled.`;
    logger.log(loggingActive, infoMessage);
  }

  const { makeActive, makeInVscode } = isMakeActive();

  if (makeInVscode) {
    const infoMessage = `Makefile found. Exiting extension.`;
    logger.log(loggingActive, infoMessage);
    deactivate();
    return;
  }

  if (makeActive) {
    showStatusBarItems = false;
    const infoMessage = `Makefile found. UI disabled.`;
    logger.log(loggingActive, infoMessage);
  }

  initFolderStatusBar(context);
  initModeStatusBar(context);
  initBuildStatusBar(context);
  initRunStatusBar(context);
  initDebugStatusBar(context);
  initCleanStatusBar(context);

  initArgumentParser();
  initWorkspaceProvider();
  initWorkspaceDisposables();
  initEventListener();
}

export function deactivate() {
  setContextValue(`${EXTENSION_NAME}:activatedExtension`, false);

  disposeItem(folderContextMenuDisposable);
  disposeItem(taskProviderDisposable);
  disposeItem(commandHandlerDisposable);
  disposeItem(toggleStatusBarDisposable);
  disposeItem(folderStatusBar);
  disposeItem(modeStatusBar);
  disposeItem(buildStatusBar);
  disposeItem(runStatusBar);
  disposeItem(debugStatusBar);
  disposeItem(cleanStatusBar);
  disposeItem(commandFolderDisposable);
  disposeItem(commandModeDisposable);
  disposeItem(commandBuildDisposable);
  disposeItem(commandRunDisposable);
  disposeItem(commandDebugDisposable);
  disposeItem(commandCleanDisposable);
  disposeItem(commandArgumentParser);
  disposeItem(eventConfigurationDisposable);
  disposeItem(eventDeleteFilesDisposable);
  disposeItem(eventRenameFilesDisposable);
}

function initWorkspaceProvider() {
  if (!workspaceFolder) return;

  if (!settingsProvider) {
    settingsProvider = new SettingsProvider(workspaceFolder);
  }

  if (!propertiesProvider) {
    propertiesProvider = new PropertiesProvider(
      settingsProvider,
      workspaceFolder,
    );
  }

  if (!activeFolder) return;

  if (!launchProvider) {
    launchProvider = new LaunchProvider(
      settingsProvider,
      workspaceFolder,
      activeFolder,
    );
  }

  if (!taskProvider) {
    taskProvider = new TaskProvider(
      settingsProvider,
      workspaceFolder,
      activeFolder,
      buildMode,
      argumentsString,
    );
  }
}

function initWorkspaceDisposables() {
  if (taskProvider && !taskProviderDisposable) {
    taskProviderDisposable = vscode.tasks.registerTaskProvider(
      EXTENSION_NAME,
      taskProvider,
    );
    if (extensionContext) {
      extensionContext.subscriptions.push(taskProviderDisposable);
    }
  }

  if (!toggleStatusBarDisposable) {
    toggleStatusBarDisposable = vscode.commands.registerCommand(
      `${EXTENSION_NAME}.toggleStatusBar`,
      () => {
        showStatusBarItems = !showStatusBarItems;
        toggleStatusBarItems();

        const infoMessage = `Called toggleStatusBar.`;
        logger.log(loggingActive, infoMessage);
      },
    );
    if (extensionContext) {
      extensionContext.subscriptions.push(toggleStatusBarDisposable);
    }
  }

  if (!folderContextMenuDisposable) {
    folderContextMenuDisposable = vscode.commands.registerCommand(
      `${EXTENSION_NAME}.folderContextMenu`,
      async (clickedUriItem: vscode.Uri, selectedUriItems: vscode.Uri[]) => {
        if (selectedUriItems.length > 1) return;

        const workspaceItem = vscode.workspace.getWorkspaceFolder(
          clickedUriItem,
        );

        if (!workspaceItem) return;

        activeFolder = clickedUriItem.fsPath;
        workspaceFolder = workspaceItem.uri.fsPath;
        updateFolderData();

        const infoMessage = `Called folderContextMenu.`;
        logger.log(loggingActive, infoMessage);
      },
    );
    if (extensionContext) {
      extensionContext.subscriptions.push(folderContextMenuDisposable);
    }
  }
}

function initEventListener() {
  if (!eventConfigurationDisposable) {
    eventConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(
      (e: vscode.ConfigurationChangeEvent) => {
        const isChanged = e.affectsConfiguration(EXTENSION_NAME);

        if (isChanged) {
          if (settingsProvider) settingsProvider.updateFileContent();
          if (propertiesProvider) propertiesProvider.updateFileContent();
          if (launchProvider) launchProvider.updateFileContent();
          if (taskProvider) taskProvider.getTasks();
        }
      },
    );
  }

  if (!eventRenameFilesDisposable) {
    eventRenameFilesDisposable = vscode.workspace.onDidRenameFiles(
      (e: vscode.FileRenameEvent) => {
        e.files.forEach((file) => {
          const oldName = file.oldUri.fsPath;
          const newName = file.newUri.fsPath;

          const infoMessage = `Renaming: ${oldName} -> ${newName}.`;
          logger.log(loggingActive, infoMessage);

          if (workspaceFolder && oldName === workspaceFolder) {
            workspaceFolder = newName;
            updateFolderData();
          } else if (activeFolder && oldName === activeFolder) {
            activeFolder = newName;
            updateFolderData();
          }
        });
      },
    );
  }

  if (!eventDeleteFilesDisposable) {
    eventDeleteFilesDisposable = vscode.workspace.onDidDeleteFiles(
      (e: vscode.FileDeleteEvent) => {
        e.files.forEach((file) => {
          const oldName = file.fsPath;

          const infoMessage = `Deleting: ${oldName}.`;
          logger.log(loggingActive, infoMessage);

          if (workspaceFolder && oldName === workspaceFolder) {
            workspaceFolder = undefined;
            updateFolderData();
            updateFolderStatus(
              folderStatusBar,
              taskProvider,
              showStatusBarItems,
            );
          } else if (activeFolder && oldName === activeFolder) {
            activeFolder = undefined;
            updateFolderData();
            updateFolderStatus(
              folderStatusBar,
              taskProvider,
              showStatusBarItems,
            );
          }
        });
      },
    );
  }
}

function toggleStatusBarItems() {
  if (showStatusBarItems) {
    if (folderStatusBar) folderStatusBar.show();
    if (modeStatusBar && activeFolder) modeStatusBar.show();
    if (buildStatusBar && activeFolder) buildStatusBar.show();
    if (runStatusBar && activeFolder) runStatusBar.show();
    if (debugStatusBar && activeFolder) debugStatusBar.show();
    if (cleanStatusBar && activeFolder) cleanStatusBar.show();
  } else {
    if (folderStatusBar) folderStatusBar.hide();
    if (modeStatusBar) modeStatusBar.hide();
    if (buildStatusBar) buildStatusBar.hide();
    if (runStatusBar) runStatusBar.hide();
    if (debugStatusBar) debugStatusBar.hide();
    if (cleanStatusBar) cleanStatusBar.hide();
  }
}

function updateFolderData() {
  initWorkspaceProvider();
  initWorkspaceDisposables();
  argumentsString = '';

  if (taskProvider) {
    taskProvider.updateFolderData(workspaceFolder, activeFolder);
    taskProvider.updateArguments(argumentsString);
    taskProvider.updateModeData(buildMode);
  }

  if (workspaceFolder && activeFolder) {
    if (settingsProvider) {
      settingsProvider.updateFolderData(workspaceFolder);
      settingsProvider.updateFileContent();

      if (propertiesProvider) {
        propertiesProvider.updateFolderData(workspaceFolder);
      }

      if (launchProvider) {
        launchProvider.updateFolderData(workspaceFolder, activeFolder);
        launchProvider.updateModeData(buildMode);
        launchProvider.updateFileContent();
      }
    }
  }

  if (folderStatusBar) {
    updateFolderStatus(folderStatusBar, taskProvider, showStatusBarItems);
  }
  if (modeStatusBar) {
    updateModeStatus(
      modeStatusBar,
      showStatusBarItems,
      activeFolder,
      buildMode,
    );
  }
  if (buildStatusBar) {
    updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);
  }
  if (runStatusBar) {
    updateRunStatus(runStatusBar, showStatusBarItems, activeFolder);
  }
  if (cleanStatusBar) {
    updateCleanStatus(cleanStatusBar, showStatusBarItems, activeFolder);
  }
  if (debugStatusBar) {
    updateDebugStatus(debugStatusBar, showStatusBarItems, activeFolder);
  }
}

// INIT STATUS BAR

function initFolderStatusBar(context: vscode.ExtensionContext) {
  folderStatusBar = createStatusBarItem();
  context.subscriptions.push(folderStatusBar);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    if (workspaceFolders.length === 1) {
      const workspaceFolderFs = workspaceFolders[0].uri.fsPath;
      const folders = foldersInDir(workspaceFolderFs);
      if (folders.length === 0) {
        workspaceFolder = workspaceFolderFs;
        activeFolder = workspaceFolderFs;
        updateFolderData();
      } else {
        updateFolderStatus(folderStatusBar, taskProvider, showStatusBarItems);
      }
    } else {
      updateFolderStatus(folderStatusBar, taskProvider, showStatusBarItems);
    }
  }

  const commandName = `${EXTENSION_NAME}.folder`;
  commandFolderDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const ret = await folderHandler(settingsProvider);
      if (ret && ret.activeFolder && ret.workspaceFolder) {
        activeFolder = ret.activeFolder;
        workspaceFolder = ret.workspaceFolder;
        updateFolderData();

        if (activeFolder.includes(' ')) {
          vscode.window.showInformationMessage(
            'This extension does not support whitespaces in a path name!',
          );
        }
      } else {
        const infoMessage = `Folder callback aborted.`;
        logger.log(loggingActive, infoMessage);
      }
    },
  );
  folderStatusBar.command = commandName;
  context.subscriptions.push(commandFolderDisposable);
}

function initModeStatusBar(context: vscode.ExtensionContext) {
  modeStatusBar = createStatusBarItem();
  context.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, showStatusBarItems, activeFolder, buildMode);

  const commandName = `${EXTENSION_NAME}.mode`;
  commandModeDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const pickedMode = await modeHandler();
      if (pickedMode) {
        buildMode = pickedMode;
        if (taskProvider) {
          taskProvider.updateModeData(buildMode);
        }
        updateModeStatus(
          modeStatusBar,
          showStatusBarItems,
          activeFolder,
          buildMode,
        );

        if (!taskProvider) return;
        taskProvider.updateModeData(buildMode);

        if (!launchProvider) return;
        launchProvider.updateModeData(buildMode);
        launchProvider.updateFileContent();
      } else {
        const infoMessage = `Mode callback aborted.`;
        logger.log(loggingActive, infoMessage);
      }
    },
  );
  modeStatusBar.command = commandName;
  context.subscriptions.push(commandModeDisposable);
}

function initArgumentParser() {
  const commandName = `${EXTENSION_NAME}.args`;

  commandArgumentParser = vscode.commands.registerCommand(
    commandName,
    async () => {
      argumentsString = await vscode.window.showInputBox();

      if (taskProvider) {
        taskProvider.updateArguments(argumentsString);
      }

      const infoMessage = `Called args.`;
      logger.log(loggingActive, infoMessage);
    },
  );
}

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = createStatusBarItem();
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.build`;
  commandBuildDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (!taskProvider || !taskProvider.tasks) {
        const infoMessage = `buildCallback failed`;
        logger.log(loggingActive, infoMessage);
        return;
      }

      taskProvider.getTasks();

      const projectFolder = taskProvider.getProjectFolder();
      if (!projectFolder) return;

      const buildTaskIndex = 0;
      const buildTask = taskProvider.tasks[buildTaskIndex];

      if (!buildTask) return;

      if (
        !buildTask.execution ||
        !(buildTask.execution instanceof vscode.ShellExecution) ||
        !buildTask.execution.commandLine
      ) {
        return;
      }

      buildTask.execution.commandLine = buildTask.execution.commandLine.replace(
        'FILE_DIR',
        projectFolder,
      );

      if (!activeFolder) return;

      const buildDir = path.join(activeFolder, 'build');
      const modeDir = path.join(buildDir, `${buildMode}`);

      if (!pathExists(modeDir)) mkdirRecursive(modeDir);

      if (!settingsProvider) return;

      if (experimentalExecutionEnabled || buildDir.includes(' ')) {
        await executeBuildTask(
          buildTask,
          settingsProvider,
          activeFolder,
          buildMode,
        );
      } else {
        await vscode.tasks.executeTask(buildTask);
      }
    },
  );
  buildStatusBar.command = commandName;
  context.subscriptions.push(commandBuildDisposable);
}

function initRunStatusBar(context: vscode.ExtensionContext) {
  runStatusBar = createStatusBarItem();
  context.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.run`;
  commandRunDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (!taskProvider || !taskProvider.tasks) {
        const infoMessage = `runCallback failed`;
        logger.log(loggingActive, infoMessage);
        return;
      }

      taskProvider.getTasks();

      const projectFolder = taskProvider.getProjectFolder();
      if (!projectFolder) return;

      const runTaskIndex = 1;
      const runTask = taskProvider.tasks[runTaskIndex];

      if (!runTask) return;

      if (
        !runTask.execution ||
        !(runTask.execution instanceof vscode.ShellExecution) ||
        !runTask.execution.commandLine
      ) {
        return;
      }

      runTask.execution.commandLine = runTask.execution.commandLine.replace(
        'FILE_DIR',
        projectFolder,
      );

      if (!activeFolder) return;

      const buildDir = path.join(activeFolder, 'build');
      const modeDir = path.join(buildDir, `${buildMode}`);

      if (!pathExists(modeDir)) return;

      if (!settingsProvider) {
        return;
      }

      if (experimentalExecutionEnabled || buildDir.includes(' ')) {
        await executeRunTask(
          runTask,
          activeFolder,
          buildMode,
          argumentsString,
          settingsProvider.operatingSystem,
        );
      } else {
        await vscode.tasks.executeTask(runTask);
      }
    },
  );

  runStatusBar.command = commandName;
  context.subscriptions.push(commandRunDisposable);
}

function initDebugStatusBar(context: vscode.ExtensionContext) {
  debugStatusBar = createStatusBarItem();
  context.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.debug`;
  commandDebugDisposable = vscode.commands.registerCommand(commandName, () => {
    if (!activeFolder || !workspaceFolder) {
      const infoMessage = `debugCallback failed`;
      logger.log(loggingActive, infoMessage);
      return;
    }

    if (taskProvider) runDebugger(activeFolder, workspaceFolder, buildMode);
  });
  debugStatusBar.command = commandName;
  context.subscriptions.push(commandDebugDisposable);
}

function initCleanStatusBar(context: vscode.ExtensionContext) {
  cleanStatusBar = createStatusBarItem();
  context.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.clean`;
  commandCleanDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (activeFolder && taskProvider) {
      } else {
        const infoMessage = `cleanCallback failed`;
        logger.log(loggingActive, infoMessage);
        return;
      }

      if (!taskProvider || !taskProvider.tasks) return;

      const cleanTaskIndex = 2;
      const cleanTask = taskProvider.tasks[cleanTaskIndex];

      if (!cleanTask) return;

      if (!activeFolder || !workspaceFolder) return;

      const buildDir = path.join(activeFolder, 'build');
      const modeDir = path.join(buildDir, `${buildMode}`);

      if (
        !cleanTask.execution ||
        !(cleanTask.execution instanceof vscode.ShellExecution) ||
        !cleanTask.execution.commandLine
      ) {
        return;
      }

      let relativeModeDir = modeDir.replace(workspaceFolder, '');
      relativeModeDir = replaceBackslashes(relativeModeDir);
      cleanTask.execution.commandLine = `echo Cleaning ${relativeModeDir}...`;

      if (!pathExists(modeDir)) return;

      rmdirRecursive(modeDir);
      await vscode.tasks.executeTask(cleanTask);
    },
  );
  cleanStatusBar.command = commandName;
  context.subscriptions.push(commandCleanDisposable);
}
