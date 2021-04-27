import * as vscode from 'vscode';

import { folderHandler } from './handler/folderHandler';
import { modeHandler } from './handler/modeHandler';
import { taskHandler } from './handler/taskHandler';
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
import { foldersInDir, noCmakeFileFound } from './utils/fileUtils';
import * as logger from './utils/logger';
import { Architectures, Builds, Tasks } from './utils/types';
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

let workspaceFolder: string | undefined;
let activeFolder: string | undefined;

let buildMode: Builds = Builds.debug;
let architectureMode: Architectures = Architectures.x64;

let errorMessage: Thenable<string | undefined> | undefined;
let showStatusBarItems: boolean = false;

export let extensionContext: vscode.ExtensionContext | undefined;
export let extensionState: vscode.Memento | undefined;
export let extensionPath: string | undefined;
export let loggingActive: boolean = false;

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  extensionPath = context.extensionPath;
  extensionState = context.workspaceState;
  updateLoggingState();
  loggingActive = getLoggingState();

  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    const infoMessage = `Empty Workspace opened.`;
    logger.log(loggingActive, infoMessage);
    return;
  }

  if (vscode.workspace.workspaceFolders.length === 1) {
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  setContextValue('C_Cpp_Runner:activatedExtension', true);

  showStatusBarItems = noCmakeFileFound();
  if (!showStatusBarItems) {
    const infoMessage = `CMake Project found. Deactivating extension.`;
    logger.log(loggingActive, infoMessage);
  }

  initFolderStatusBar(context);
  initModeStatusBar(context);
  initBuildStatusBar(context);
  initRunStatusBar(context);
  initDebugStatusBar(context);
  initCleanStatusBar(context);

  initWorkspaceProvider();
  initWorkspaceDisposables();
  initEventListener();
}

export function deactivate() {
  setContextValue('C_Cpp_Runner:activatedExtension', false);

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
      architectureMode,
    );
  }
}

function initWorkspaceDisposables() {
  if (taskProvider && !taskProviderDisposable) {
    taskProviderDisposable = vscode.tasks.registerTaskProvider(
      'C_Cpp_Runner',
      taskProvider,
    );
    if (extensionContext) {
      extensionContext.subscriptions.push(taskProviderDisposable);
    }
  }

  if (!commandHandlerDisposable) {
    commandHandlerDisposable = vscode.commands.registerCommand(
      'C_Cpp_Runner.tasks',
      () => {
        let showErrorMessage = false;

        if (!showStatusBarItems) {
          showStatusBarItems = true;
          toggleStatusBarItems();
        } else {
          if (!errorMessage) {
            showErrorMessage = true;
          }
        }

        if (!workspaceFolder) {
          if (showErrorMessage) {
            errorMessage = vscode.window.showErrorMessage(
              'You have to select a folder first.',
            );
            errorMessage.then(() => (errorMessage = undefined));
          }
        } else {
          errorMessage = undefined;

          if (taskProvider) {
            taskProvider.getTasks();
            taskHandler(taskProvider);
          }
        }
      },
    );
    if (extensionContext) {
      extensionContext.subscriptions.push(commandHandlerDisposable);
    }
  }

  if (!toggleStatusBarDisposable) {
    toggleStatusBarDisposable = vscode.commands.registerCommand(
      'C_Cpp_Runner.toggleStatusBar',
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
      'C_Cpp_Runner.folderContextMenu',
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
  vscode.workspace.onDidChangeConfiguration(() => {
    const infoMessage = `Configuration change.`;
    logger.log(loggingActive, infoMessage);
    updateLoggingState();

    if (settingsProvider) settingsProvider.getSettings();
    if (taskProvider) taskProvider.getTasks();
    if (propertiesProvider) propertiesProvider.updateFileContent();
    if (launchProvider) launchProvider.updateFileContent();
  });

  vscode.workspace.onDidRenameFiles((e: vscode.FileRenameEvent) => {
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
  });

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

  if (taskProvider) {
    taskProvider.updatFolderData(workspaceFolder, activeFolder);
    if (buildMode && architectureMode) {
      taskProvider.updateModeData(buildMode, architectureMode);
    }
  }

  if (workspaceFolder && activeFolder) {
    if (settingsProvider) {
      settingsProvider.updatFolderData(workspaceFolder);
      settingsProvider.checkCompilers();
    }

    if (propertiesProvider) {
      propertiesProvider.updatFolderData(workspaceFolder);
    }
    if (launchProvider) {
      launchProvider.updatFolderData(workspaceFolder, activeFolder);
      launchProvider.updateFileContent();
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
      architectureMode,
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

  const commandName = 'C_Cpp_Runner.init';
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
  updateModeStatus(
    modeStatusBar,
    showStatusBarItems,
    activeFolder,
    buildMode,
    architectureMode,
  );

  const commandName = 'C_Cpp_Runner.mode';
  commandModeDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const ret = await modeHandler(settingsProvider);
      if (ret && ret.pickedArchitecture && ret.pickedMode) {
        buildMode = ret.pickedMode;
        architectureMode = ret.pickedArchitecture;
        if (taskProvider) {
          taskProvider.updateModeData(buildMode, architectureMode);
        }
        updateModeStatus(
          modeStatusBar,
          showStatusBarItems,
          activeFolder,
          buildMode,
          architectureMode,
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

function initBuildStatusBar(context: vscode.ExtensionContext) {
  buildStatusBar = createStatusBarItem();
  context.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);

  const commandName = 'C_Cpp_Runner.build';
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

  const commandName = 'C_Cpp_Runner.run';
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
      if (task.name.includes(Tasks.run)) {
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

  const commandName = 'C_Cpp_Runner.debug';
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

  const commandName = 'C_Cpp_Runner.clean';
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
