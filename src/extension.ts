import * as vscode from 'vscode';

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
import { foldersInDir, isCmakeActive, isMakeActive } from './utils/fileUtils';
import * as logger from './utils/logger';
import { Builds, Tasks } from './utils/types';
import {
  createStatusBarItem,
  disposeItem,
  getLoggingState,
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

  if (vscode.workspace.workspaceFolders.length === 1) {
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  setContextValue(`${EXTENSION_NAME}:activatedExtension`, true);

  const cmakeActive = isCmakeActive();
  if (cmakeActive) {
    showStatusBarItems = false;
    const infoMessage = `CMake Project found. Deactivating extension.`;
    logger.log(loggingActive, infoMessage);
  }

  const makeActive = isMakeActive();
  if (makeActive) {
    showStatusBarItems = false;
    const infoMessage = `Makefile found. Deactivating extension.`;
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
        if (e.affectsConfiguration(EXTENSION_NAME)) {
          const infoMessage = `Configuration change.`;
          logger.log(loggingActive, infoMessage);
          updateLoggingState();

          if (settingsProvider) settingsProvider.getSettings();
          if (taskProvider) taskProvider.getTasks();
          if (propertiesProvider) propertiesProvider.updateFileContent();
          if (launchProvider) launchProvider.updateFileContent();
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
    vscode.workspace.onDidDeleteFiles((e: vscode.FileDeleteEvent) => {
      e.files.forEach((file) => {
        const oldName = file.fsPath;

        const infoMessage = `Deleting: ${oldName}.`;
        logger.log(loggingActive, infoMessage);

        if (workspaceFolder && oldName === workspaceFolder) {
          workspaceFolder = undefined;
          updateFolderData();
          updateFolderStatus(folderStatusBar, taskProvider, showStatusBarItems);
        } else if (activeFolder && oldName === activeFolder) {
          activeFolder = undefined;
          updateFolderData();
          updateFolderStatus(folderStatusBar, taskProvider, showStatusBarItems);
        }
      });
    });
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
    if (buildMode) {
      taskProvider.updateModeData(buildMode);
    }
  }

  if (workspaceFolder && activeFolder) {
    if (settingsProvider) {
      settingsProvider.updateFolderData(workspaceFolder);
      settingsProvider.getCommands();
    }

    if (propertiesProvider) {
      propertiesProvider.updateFolderData(workspaceFolder);
    }

    if (launchProvider) {
      launchProvider.updateFolderData(workspaceFolder, activeFolder);
      launchProvider.updateFileContent();
    }

    if (settingsProvider) {
      settingsProvider.getSettings();
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
      const ret = await folderHandler();
      if (ret && ret.activeFolder && ret.workspaceFolder) {
        activeFolder = ret.activeFolder;
        workspaceFolder = ret.workspaceFolder;
        updateFolderData();
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
    },
  );
}

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = createStatusBarItem();
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.build`;
  commandBuildDisposable = vscode.commands.registerCommand(commandName, () => {
    if (
      !taskProvider ||
      !taskProvider.tasks ||
      !taskProvider.workspaceFolder ||
      !taskProvider.activeFolder
    ) {
      const infoMessage = `buildCallback: No Folder or Tasks defined.`;
      logger.log(loggingActive, infoMessage);
      return;
    }

    taskProvider.getTasks();

    const projectFolder = taskProvider.getProjectFolder();
    if (!projectFolder) return;

    taskProvider.tasks.forEach(async (task) => {
      if (task.name.includes(Tasks.build)) {
        if (
          task.execution &&
          task.execution instanceof vscode.ShellExecution &&
          task.execution.commandLine
        ) {
          task.execution.commandLine = task.execution.commandLine.replace(
            'FILE_DIR',
            projectFolder,
          );
        }
        await vscode.tasks.executeTask(task);
      }
    });
  });
  buildStatusBar.command = commandName;
  context.subscriptions.push(commandBuildDisposable);
}

function initRunStatusBar(context: vscode.ExtensionContext) {
  runStatusBar = createStatusBarItem();
  context.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.run`;
  commandRunDisposable = vscode.commands.registerCommand(commandName, () => {
    if (
      !taskProvider ||
      !taskProvider.tasks ||
      !taskProvider.workspaceFolder ||
      !taskProvider.activeFolder
    ) {
      const infoMessage = `runCallback: No Folder or Tasks defined.`;
      logger.log(loggingActive, infoMessage);
      return;
    }

    taskProvider.getTasks();

    const projectFolder = taskProvider.getProjectFolder();
    if (!projectFolder) return;

    taskProvider.tasks.forEach(async (task) => {
      if (task.name.includes(`${Tasks.run}: `)) {
        if (
          task.execution &&
          task.execution instanceof vscode.ShellExecution &&
          task.execution.commandLine
        ) {
          task.execution.commandLine = task.execution.commandLine.replace(
            'FILE_DIR',
            projectFolder,
          );
        }

        await vscode.tasks.executeTask(task);
      }
    });
  });
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
      const infoMessage = `debugCallback: No Workspace or Folder picked.`;
      logger.log(loggingActive, infoMessage);
      return;
    }

    if (taskProvider) taskProvider.runDebugTask();
  });
  debugStatusBar.command = commandName;
  context.subscriptions.push(commandDebugDisposable);
}

function initCleanStatusBar(context: vscode.ExtensionContext) {
  cleanStatusBar = createStatusBarItem();
  context.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.clean`;
  commandCleanDisposable = vscode.commands.registerCommand(commandName, () => {
    if (
      !taskProvider ||
      !taskProvider.tasks ||
      !taskProvider.workspaceFolder ||
      !taskProvider.activeFolder
    ) {
      const infoMessage = `cleanCallback: No Folder or Tasks defined.`;
      logger.log(loggingActive, infoMessage);
      return;
    }

    taskProvider.getTasks();

    const projectFolder = taskProvider.getProjectFolder();
    if (!projectFolder) return;

    taskProvider.tasks.forEach(async (task) => {
      if (task.name.includes(Tasks.clean)) {
        if (
          task.execution &&
          task.execution instanceof vscode.ShellExecution &&
          task.execution.commandLine
        ) {
          task.execution.commandLine = task.execution.commandLine.replace(
            'FILE_DIR',
            projectFolder,
          );
        }
        await vscode.tasks.executeTask(task);
      }
    });
  });
  cleanStatusBar.command = commandName;
  context.subscriptions.push(commandCleanDisposable);
}
