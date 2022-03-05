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
	getActivationState,
	getLoggingState,
	isCmakeProject,
	setContextValue,
	updateActivationState,
	updateLoggingState,
} from './utils/vscodeUtils';

let folderContextMenuDisposable: vscode.Disposable | undefined;
let taskProviderDisposable: Readonly<vscode.Disposable | undefined>;
let commandHandlerDisposable: vscode.Disposable | undefined;
let commandToggleStateDisposable: vscode.Disposable | undefined;
let commandFolderDisposable: vscode.Disposable | undefined;
let commandModeDisposable: vscode.Disposable | undefined;
let commandBuildDisposable: vscode.Disposable | undefined;
let commandRunDisposable: vscode.Disposable | undefined;
let commandBuildSingleFileDisposable: vscode.Disposable | undefined;
let commandRunSingleFileDisposable: vscode.Disposable | undefined;
let commandDebugSingleFileDisposable: vscode.Disposable | undefined;
let commandDebugDisposable: vscode.Disposable | undefined;
let commandCleanDisposable: vscode.Disposable | undefined;
let commandArgumentDisposable: vscode.Disposable | undefined;
let commandResetDisposable: vscode.Disposable | undefined;
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
let createExtensionFiles: boolean = true;

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

  if (
    !vscode.workspace.workspaceFolders[0] ||
    !vscode.workspace.workspaceFolders[0].uri
  ) {
    return;
  }

  if (vscode.workspace.workspaceFolders.length === 1) {
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  const cmakeFileFound = isCmakeProject();

  if (cmakeFileFound) {
    showStatusBarItems = false;
    createExtensionFiles = false;
    const infoMessage = `CMake Project found. UI disabled.`;
    logger.log(loggingActive, infoMessage);
  }

  extensionContext = context;
  extensionPath = context.extensionPath;
  extensionState = context.workspaceState;
  updateLoggingState();
  loggingActive = getLoggingState();
  setContextValue(`${EXTENSION_NAME}:activatedExtension`, true);
  updateActivationState(true);

  initFolderStatusBar();
  initModeStatusBar();
  initBuildStatusBar();
  initRunStatusBar();
  initDebugStatusBar();
  initCleanStatusBar();

  initBuildSingleFile();
  initRunSingleFile();
  initDebugSingleFile();

  initWorkspaceProvider();
  initWorkspaceDisposables();
  initEventListener();
}

export function deactivate() {
  setContextValue(`${EXTENSION_NAME}:activatedExtension`, false);
  updateActivationState(false);

  disposeItem(folderStatusBar);
  disposeItem(modeStatusBar);
  disposeItem(buildStatusBar);
  disposeItem(runStatusBar);
  disposeItem(debugStatusBar);
  disposeItem(cleanStatusBar);
  disposeItem(taskProviderDisposable);
  disposeItem(folderContextMenuDisposable);
  disposeItem(commandHandlerDisposable);
  disposeItem(commandToggleStateDisposable);
  disposeItem(commandFolderDisposable);
  disposeItem(commandModeDisposable);
  disposeItem(commandBuildDisposable);
  disposeItem(commandRunDisposable);
  disposeItem(commandBuildSingleFileDisposable);
  disposeItem(commandRunSingleFileDisposable);
  disposeItem(commandDebugSingleFileDisposable);
  disposeItem(commandDebugDisposable);
  disposeItem(commandCleanDisposable);
  disposeItem(commandArgumentDisposable);
  disposeItem(commandResetDisposable);
  disposeItem(eventConfigurationDisposable);
  disposeItem(eventDeleteFilesDisposable);
  disposeItem(eventRenameFilesDisposable);
}

function initWorkspaceProvider() {
  if (!workspaceFolder || !createExtensionFiles || !activeFolder) return;

  if (!settingsProvider) {
    settingsProvider = new SettingsProvider(workspaceFolder, activeFolder);
  }

  if (!propertiesProvider) {
    propertiesProvider = new PropertiesProvider(
      settingsProvider,
      workspaceFolder,
      activeFolder,
    );
  }

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
    );
  }
}

function initWorkspaceDisposables() {
  initTaskProviderDisposable();
  initArgumentParser();
  initContextMenuDisposable();
  initReset();
  initToggleDisposable();
}

function initTaskProviderDisposable() {
  if (!taskProvider || taskProviderDisposable) return;

  taskProviderDisposable = vscode.tasks.registerTaskProvider(
    EXTENSION_NAME,
    taskProvider,
  );

  extensionContext?.subscriptions.push(taskProviderDisposable);
}

function initToggleDisposable() {
  if (commandToggleStateDisposable) return;

  commandToggleStateDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.toggleExtensionState`,
    () => {
      showStatusBarItems = !showStatusBarItems;
      toggleStatusBarItems();
      createExtensionFiles = !createExtensionFiles;
      if (createExtensionFiles) {
        initWorkspaceProvider();
        initWorkspaceDisposables();

        settingsProvider?.createFileData();
        propertiesProvider?.createFileData();
      }

      const extensionIsDisabled = !showStatusBarItems && !createExtensionFiles;

      if (extensionIsDisabled) {
        setContextValue(
          `${EXTENSION_NAME}:activatedExtension`,
          !extensionIsDisabled,
        );
        updateActivationState(!extensionIsDisabled);
      } else {
        setContextValue(
          `${EXTENSION_NAME}:activatedExtension`,
          !extensionIsDisabled,
        );
        updateActivationState(!extensionIsDisabled);
      }

      const infoMessage = `Called toggleExtensionState.`;
      logger.log(loggingActive, infoMessage);
    },
  );

  extensionContext?.subscriptions.push(commandToggleStateDisposable);
}

function initContextMenuDisposable() {
  if (folderContextMenuDisposable) return;

  folderContextMenuDisposable = vscode.commands.registerCommand(
    `${EXTENSION_NAME}.folderContextMenu`,
    async (clickedUriItem: vscode.Uri, selectedUriItems: vscode.Uri[]) => {
      if (selectedUriItems.length > 1) return;

      const workspaceItem = vscode.workspace.getWorkspaceFolder(clickedUriItem);

      if (!workspaceItem) return;

      activeFolder = clickedUriItem.fsPath;
      workspaceFolder = workspaceItem.uri.fsPath;
      updateFolderData();

      const infoMessage = `Called folderContextMenu.`;
      logger.log(loggingActive, infoMessage);
    },
  );

  extensionContext?.subscriptions.push(folderContextMenuDisposable);
}

function initEventListener() {
  initConfigurationChangeDisposable();
  initFileRenameDisposable();
  initFileDeleteDisposable();
}

function initConfigurationChangeDisposable() {
  if (eventConfigurationDisposable) return;

  eventConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(
    (e: vscode.ConfigurationChangeEvent) => {
      const isChanged = e.affectsConfiguration(EXTENSION_NAME);
      const extensionIsActive = getActivationState();

      if (isChanged && extensionIsActive) {
        settingsProvider?.updateFileContent();
        propertiesProvider?.updateFileContent();
        launchProvider?.updateFileContent();
        taskProvider?.getTasks();
      }
    },
  );

  extensionContext?.subscriptions.push(eventConfigurationDisposable);
}

function initFileRenameDisposable() {
  if (eventRenameFilesDisposable) return;

  eventRenameFilesDisposable = vscode.workspace.onDidRenameFiles(
    (e: vscode.FileRenameEvent) => {
      const extensionIsActive = getActivationState();
      if (!extensionIsActive) return;

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

  extensionContext?.subscriptions.push(eventRenameFilesDisposable);
}

function initFileDeleteDisposable() {
  if (!eventDeleteFilesDisposable) return;

  eventDeleteFilesDisposable = vscode.workspace.onDidDeleteFiles(
    (e: vscode.FileDeleteEvent) => {
      const extensionIsActive = getActivationState();
      if (!extensionIsActive) return;

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
    },
  );

  extensionContext?.subscriptions.push(eventDeleteFilesDisposable);
}

function toggleStatusBarItems() {
  if (showStatusBarItems) {
    folderStatusBar?.show();
    modeStatusBar?.show();
    buildStatusBar?.show();
    runStatusBar?.show();
    debugStatusBar?.show();
    cleanStatusBar?.show();
  } else {
    folderStatusBar?.hide();
    modeStatusBar?.hide();
    buildStatusBar?.hide();
    runStatusBar?.hide();
    debugStatusBar?.hide();
    cleanStatusBar?.hide();
  }
}

function updateFolderData() {
  initWorkspaceProvider();
  initWorkspaceDisposables();
  argumentsString = '';

  if (taskProvider) {
    taskProvider.updateFolderData(workspaceFolder, activeFolder);
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
        launchProvider?.updateArgumentsData(argumentsString);
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

function initFolderStatusBar() {
  if (folderStatusBar) return;

  folderStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(folderStatusBar);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    if (workspaceFolders.length === 1) {
      if (!workspaceFolders[0] || !workspaceFolders[0].uri.fsPath) return;

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

  if (commandFolderDisposable) return;

  const commandName = `${EXTENSION_NAME}.folder`;
  commandFolderDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const ret = await folderHandler(settingsProvider);
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
  extensionContext?.subscriptions.push(commandFolderDisposable);
}

function initModeStatusBar() {
  if (modeStatusBar) return;

  modeStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(modeStatusBar);
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
  extensionContext?.subscriptions.push(commandModeDisposable);
}

function initArgumentParser() {
  if (commandArgumentDisposable) return;

  const commandName = `${EXTENSION_NAME}.args`;

  commandArgumentDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      argumentsString = await vscode.window.showInputBox();
      launchProvider?.updateArgumentsData(argumentsString);
      launchProvider?.updateFileContent();
    },
  );

  extensionContext?.subscriptions.push(commandArgumentDisposable);
}

function initReset() {
  if (commandResetDisposable) return;

  const commandName = `${EXTENSION_NAME}.resetLocalSettings`;

  commandResetDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      settingsProvider?.reset();
      propertiesProvider?.updateFileContent();
      taskProvider?.getTasks();
      launchProvider?.updateFileContent();
    },
  );

  extensionContext?.subscriptions.push(commandResetDisposable);
}

function initBuildStatusBar() {
  if (buildStatusBar) return;

  buildStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.build`;
  commandBuildDisposable = vscode.commands.registerCommand(
    commandName,
    async () => buildTaskCallback(false),
  );
  buildStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandBuildDisposable);
}

function initRunStatusBar() {
  if (runStatusBar) return;

  runStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.run`;
  commandRunDisposable = vscode.commands.registerCommand(
    commandName,
    async () => runTaskCallback(),
  );

  runStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandRunDisposable);
}

function initDebugStatusBar() {
  if (debugStatusBar) return;

  debugStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.debug`;
  commandDebugDisposable = vscode.commands.registerCommand(commandName, () =>
    debugTaskCallback(),
  );

  debugStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandDebugDisposable);
}

function initCleanStatusBar() {
  if (cleanStatusBar) return;

  cleanStatusBar = createStatusBarItem();
  extensionContext?.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.clean`;
  commandCleanDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (
        !taskProvider ||
        !taskProvider.tasks ||
        !activeFolder ||
        !workspaceFolder
      ) {
        const infoMessage = `cleanCallback failed`;
        logger.log(loggingActive, infoMessage);
        return;
      }
      const cleanTaskIndex = 2;
      const cleanTask = taskProvider.tasks[cleanTaskIndex];

      if (!cleanTask) return;

      const buildDir = path.join(activeFolder, 'build');
      const modeDir = path.join(buildDir, `${buildMode}`);

      if (
        !cleanTask.execution ||
        !(cleanTask.execution instanceof vscode.ProcessExecution)
      ) {
        return;
      }

      let relativeModeDir = modeDir.replace(workspaceFolder, '');
      relativeModeDir = replaceBackslashes(relativeModeDir);

      if (cleanTask.execution.args.length !== 3) return;

      cleanTask.execution.args[2] = `echo Cleaning ${relativeModeDir}...`;

      if (!pathExists(modeDir)) return;

      rmdirRecursive(modeDir);
      await vscode.tasks.executeTask(cleanTask);
    },
  );

  cleanStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandCleanDisposable);
}

function initProviderBasedOnSingleFile() {
  const currentFile = vscode.window.activeTextEditor?.document.fileName;
  if (!currentFile) return;
  const currentFolder = path.dirname(currentFile);
  if (activeFolder !== currentFolder) {
    activeFolder = currentFolder;
    initWorkspaceProvider();
    updateFolderData();
  }
}

function initBuildSingleFile() {
  const commandName = `${EXTENSION_NAME}.buildSingleFile`;
  commandBuildSingleFileDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      initProviderBasedOnSingleFile();
      buildTaskCallback(true);
    },
  );
  extensionContext?.subscriptions.push(commandBuildSingleFileDisposable);
}

function initRunSingleFile() {
  const commandName = `${EXTENSION_NAME}.runSingleFile`;
  commandRunSingleFileDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      initProviderBasedOnSingleFile();
      runTaskCallback();
    },
  );
  extensionContext?.subscriptions.push(commandRunSingleFileDisposable);
}

function initDebugSingleFile() {
  const commandName = `${EXTENSION_NAME}.debugSingleFile`;
  commandDebugSingleFileDisposable = vscode.commands.registerCommand(
    commandName,
    () => {
      initProviderBasedOnSingleFile();
      debugTaskCallback();
    },
  );
  extensionContext?.subscriptions.push(commandDebugSingleFileDisposable);
}

async function buildTaskCallback(singleFileBuild: boolean) {
  if (!activeFolder) return;

  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  if (!pathExists(modeDir)) mkdirRecursive(modeDir);

  if (!settingsProvider) return;

  await executeBuildTask(
    settingsProvider,
    activeFolder,
    buildMode,
    singleFileBuild,
  );
}

async function runTaskCallback() {
  if (!activeFolder) return;

  const buildDir = path.join(activeFolder, 'build');
  const modeDir = path.join(buildDir, `${buildMode}`);

  if (!pathExists(modeDir)) return;

  if (!settingsProvider) {
    return;
  }

  await executeRunTask(
    activeFolder,
    buildMode,
    argumentsString,
    settingsProvider.operatingSystem,
  );
}

function debugTaskCallback() {
  runDebugger(activeFolder, workspaceFolder, buildMode);
}
