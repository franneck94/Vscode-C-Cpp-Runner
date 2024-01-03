import * as path from 'path';
import * as vscode from 'vscode';

import { generateAssemblerCode } from './executor/assembler';
import { executeBuildTask, getExecutableName } from './executor/builder';
import { executeCleanTask } from './executor/cleaner';
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
import { EXTENSION_NAME } from './params/params';
import { LaunchProvider } from './provider/launchProvider';
import { PropertiesProvider } from './provider/propertiesProvider';
import { SettingsProvider } from './provider/settingsProvider';
import { Builds, Languages } from './types/enums';
import {
  excludePatternFromList,
  foldersInDir,
  getAllSourceFilesFolderBased,
  getAllSourceFilesSingleFileBased,
  getBuildModeDir,
  isNonRelativePath,
  mkdirRecursive,
  pathExists,
} from './utils/fileUtils';
import { checkForCompilerIsValid } from './utils/systemUtils';
import {
  createStatusBarItem,
  disposeItem,
  getActivationState,
  isCmakeProject,
  setContextValue,
  updateActivationState,
} from './utils/vscodeUtils';

let folderContextMenuDisposable: vscode.Disposable | undefined;
let commandHandlerDisposable: vscode.Disposable | undefined;
let commandToggleStateDisposable: vscode.Disposable | undefined;
let commandFolderDisposable: vscode.Disposable | undefined;
let commandModeDisposable: vscode.Disposable | undefined;
let commandBuildDisposable: vscode.Disposable | undefined;
let commandRunDisposable: vscode.Disposable | undefined;
let commandBuildSingleFileDisposable: vscode.Disposable | undefined;
let commandRunCurrentSelectionDisposable: vscode.Disposable | undefined;
let commandDebugCurrentSelectionDisposable: vscode.Disposable | undefined;
let commandDebugDisposable: vscode.Disposable | undefined;
let commandCleanDisposable: vscode.Disposable | undefined;
let commandArgumentDisposable: vscode.Disposable | undefined;
let commandResetDisposable: vscode.Disposable | undefined;
let commanAssemblerDisposable: vscode.Disposable | undefined;
let eventConfigurationDisposable: vscode.Disposable | undefined;
let eventRenameFilesDisposable: vscode.Disposable | undefined;
let eventDeleteFilesDisposable: vscode.Disposable | undefined;

let settingsProvider: SettingsProvider | undefined;
let launchProvider: LaunchProvider | undefined;
let propertiesProvider: PropertiesProvider | undefined;

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

let updatedFileContent: boolean = false;

export let extensionContext: vscode.ExtensionContext | undefined;
export let extensionState: vscode.Memento | undefined;
export let extensionPath: string | undefined;

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
  }

  extensionContext = context;
  extensionPath = context.extensionPath;
  extensionState = context.workspaceState;

  setContextValue(`${EXTENSION_NAME}:activatedExtension`, true);
  updateActivationState(true);

  initFolderStatusBar();
  initModeStatusBar();
  initBuildStatusBar();
  initRunStatusBar();
  initDebugStatusBar();
  initCleanStatusBar();

  initAssemblerGenerator();

  initBuildSingleFile();
  initRunCurrentSelection();
  initDebugCurrentSelection();

  initWorkspaceProvider();
  initWorkspaceDisposables();
  initEventListener();

  initEditorBuildDebug();
  initEditorBuildRun();
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
  disposeItem(folderContextMenuDisposable);
  disposeItem(commandHandlerDisposable);
  disposeItem(commandToggleStateDisposable);
  disposeItem(commandFolderDisposable);
  disposeItem(commandModeDisposable);
  disposeItem(commandBuildDisposable);
  disposeItem(commandRunDisposable);
  disposeItem(commandBuildSingleFileDisposable);
  disposeItem(commandRunCurrentSelectionDisposable);
  disposeItem(commandDebugCurrentSelectionDisposable);
  disposeItem(commandDebugDisposable);
  disposeItem(commandCleanDisposable);
  disposeItem(commandArgumentDisposable);
  disposeItem(commandResetDisposable);
  disposeItem(eventConfigurationDisposable);
  disposeItem(eventDeleteFilesDisposable);
  disposeItem(eventRenameFilesDisposable);
}

async function initWorkspaceProvider() {
  if (!workspaceFolder || !createExtensionFiles || !activeFolder) return;

  if (!settingsProvider) {
    settingsProvider = new SettingsProvider(workspaceFolder, activeFolder);

    const cCompilerIsValid = await checkForCompilerIsValid(
      `${settingsProvider.cCompilerPath} --version`,
    );
    const cppCompilerIsValid = await checkForCompilerIsValid(
      `${settingsProvider.cppCompilerPath} --version`,
    );

    if (!cCompilerIsValid && !cppCompilerIsValid) {
      vscode.window.showErrorMessage(
        "The compiler that you have set does not exist or wasn't installed properly.",
      );
    }
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
}

function initWorkspaceDisposables() {
  initArgumentParser();
  initContextMenuDisposable();
  initReset();
  initToggleDisposable();
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
    },
  );

  extensionContext?.subscriptions.push(folderContextMenuDisposable);
}

function initEventListener() {
  initConfigurationChangeDisposable();
  initFileRenameDisposable();
  initFileDeleteDisposable();
}

function initEditorBuildDebug() {
  extensionContext?.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.BuildAndDebugFile`,
      async () => {
        const commandNameBuild = `${EXTENSION_NAME}.buildSingleFile`;
        await vscode.commands.executeCommand(commandNameBuild);

        const commandNameDebug = `${EXTENSION_NAME}.debugCurrentSelection`;
        await vscode.commands.executeCommand(commandNameDebug);
      },
    ),
  );
}

function initEditorBuildRun() {
  extensionContext?.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.BuildAndRunFile`,
      async () => {
        await vscode.commands.executeCommand(
          `${EXTENSION_NAME}.buildSingleFile`,
        );
        await vscode.commands.executeCommand(
          `${EXTENSION_NAME}.runCurrentSelection`,
        );
      },
    ),
  );
}

function initConfigurationChangeDisposable() {
  if (eventConfigurationDisposable) return;

  eventConfigurationDisposable = vscode.workspace.onDidChangeConfiguration(
    (e: vscode.ConfigurationChangeEvent) => {
      const isChanged = e.affectsConfiguration(EXTENSION_NAME);
      const extensionIsActive = getActivationState();

      if (isChanged && extensionIsActive) {
        if (updatedFileContent) {
          updatedFileContent = false;
          return;
        }

        propertiesProvider?.updateFileContent();
        launchProvider?.updateFileContent();
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

        if (workspaceFolder && oldName === workspaceFolder) {
          workspaceFolder = undefined;
          updateFolderData();
          updateFolderStatus(
            folderStatusBar,
            workspaceFolder,
            activeFolder,
            showStatusBarItems,
          );
        } else if (activeFolder && oldName === activeFolder) {
          activeFolder = undefined;
          updateFolderData();
          updateFolderStatus(
            folderStatusBar,
            workspaceFolder,
            activeFolder,
            showStatusBarItems,
          );
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

  if (workspaceFolder && activeFolder) {
    if (settingsProvider) {
      updatedFileContent = true;

      settingsProvider.updateFolderData(workspaceFolder);
      settingsProvider.updateFileContent();

      if (propertiesProvider) {
        propertiesProvider.updateFolderData(workspaceFolder);
      }

      if (launchProvider) {
        launchProvider.updateFolderData(workspaceFolder, activeFolder);
        launchProvider.updateModeData(buildMode);
        launchProvider.updateArgumentsData(argumentsString);
        launchProvider.updateFileContent();
      }
    }
  }

  if (folderStatusBar) {
    updateFolderStatus(
      folderStatusBar,
      workspaceFolder,
      activeFolder,
      showStatusBarItems,
    );
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
  folderStatusBar.tooltip = 'Which Folder to Compile';
  extensionContext?.subscriptions.push(folderStatusBar);

  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders === undefined) return;
  if (workspaceFolders.length > 1) return;
  if (!workspaceFolders[0] || !workspaceFolders[0].uri.fsPath) return;

  const workspaceFolderFs = workspaceFolders[0].uri.fsPath;
  let folders = foldersInDir(workspaceFolderFs);

  folders = excludePatternFromList(
    SettingsProvider.DEFAULT_EXCLUDE_SEARCH,
    folders,
  );

  if (folders.length === 0) {
    workspaceFolder = workspaceFolderFs;
    activeFolder = workspaceFolderFs;
    updateFolderData();
  } else {
    if (workspaceFolder && !activeFolder) {
      const { files: filesFolder, language: _ } =
        getAllSourceFilesFolderBased(workspaceFolder);

      const { files: filesSingle, language: __ } =
        getAllSourceFilesSingleFileBased();

      if (filesFolder.length > 0) {
        activeFolder = workspaceFolder;
      } else if (filesSingle.length > 0 && filesSingle[0] !== undefined) {
        const openedFile = filesSingle[0];
        const openedFileDir = path.dirname(openedFile);
        activeFolder = openedFileDir;
      }
    }

    updateFolderData();
  }

  updateFolderStatus(
    folderStatusBar,
    workspaceFolder,
    activeFolder,
    showStatusBarItems,
  );

  if (commandFolderDisposable) return;

  const commandName = `${EXTENSION_NAME}.selectFolder`;
  commandFolderDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const ret = await folderHandler(settingsProvider);
      if (ret && ret.activeFolder && ret.workspaceFolder) {
        activeFolder = ret.activeFolder;
        workspaceFolder = ret.workspaceFolder;
        updateFolderData();
      }
    },
  );

  folderStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandFolderDisposable);
}

function initModeStatusBar() {
  if (modeStatusBar) return;

  modeStatusBar = createStatusBarItem();
  modeStatusBar.tooltip = 'Select Compilation Mode';
  extensionContext?.subscriptions.push(modeStatusBar);
  updateModeStatus(modeStatusBar, showStatusBarItems, activeFolder, buildMode);

  const commandName = `${EXTENSION_NAME}.selectMode`;
  commandModeDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      const pickedMode = await modeHandler();
      if (pickedMode) {
        buildMode = pickedMode;

        updateModeStatus(
          modeStatusBar,
          showStatusBarItems,
          activeFolder,
          buildMode,
        );

        if (!launchProvider) return;
        launchProvider.updateModeData(buildMode);
        launchProvider.updateFileContent();
      }
    },
  );

  modeStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandModeDisposable);
}

function initArgumentParser() {
  if (commandArgumentDisposable) return;

  const commandName = `${EXTENSION_NAME}.addCmdArgs`;

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
      launchProvider?.updateFileContent();
    },
  );

  extensionContext?.subscriptions.push(commandResetDisposable);
}

function initBuildStatusBar() {
  if (buildStatusBar) return;

  buildStatusBar = createStatusBarItem();
  buildStatusBar.tooltip = 'Start Compilation';
  extensionContext?.subscriptions.push(buildStatusBar);
  updateBuildStatus(buildStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.buildFolder`;
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
  runStatusBar.tooltip = 'Run Executable';
  extensionContext?.subscriptions.push(runStatusBar);
  updateRunStatus(runStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.runFolder`;
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
  debugStatusBar.tooltip = 'Start Debugging';
  extensionContext?.subscriptions.push(debugStatusBar);
  updateDebugStatus(debugStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.debugFolder`;
  commandDebugDisposable = vscode.commands.registerCommand(commandName, () =>
    debugTaskCallback(),
  );

  debugStatusBar.command = commandName;
  extensionContext?.subscriptions.push(commandDebugDisposable);
}

async function initCleanStatusBar() {
  if (cleanStatusBar) return;

  cleanStatusBar = createStatusBarItem();
  cleanStatusBar.tooltip = 'Clean Build';
  extensionContext?.subscriptions.push(cleanStatusBar);
  updateCleanStatus(cleanStatusBar, showStatusBarItems, activeFolder);

  const commandName = `${EXTENSION_NAME}.cleanFolder`;
  commandCleanDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      cleanTaskCallback();
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

function initRunCurrentSelection() {
  const commandName = `${EXTENSION_NAME}.runCurrentSelection`;
  commandRunCurrentSelectionDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      initProviderBasedOnSingleFile();
      runTaskCallback();
    },
  );
  extensionContext?.subscriptions.push(commandRunCurrentSelectionDisposable);
}

function initDebugCurrentSelection() {
  const commandName = `${EXTENSION_NAME}.debugCurrentSelection`;
  commandDebugCurrentSelectionDisposable = vscode.commands.registerCommand(
    commandName,
    () => {
      initProviderBasedOnSingleFile();
      debugTaskCallback();
    },
  );
  extensionContext?.subscriptions.push(commandDebugCurrentSelectionDisposable);
}

function initAssemblerGenerator() {
  if (commanAssemblerDisposable) return;

  const commandName = `${EXTENSION_NAME}.generateAssembler`;

  commanAssemblerDisposable = vscode.commands.registerCommand(
    commandName,
    async () => {
      if (!activeFolder) {
        initProviderBasedOnSingleFile();
      }
      generateAssemblerCallback();
    },
  );

  extensionContext?.subscriptions.push(commanAssemblerDisposable);
}

async function generateAssemblerCallback() {
  if (!activeFolder) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);

  if (!pathExists(modeDir)) mkdirRecursive(modeDir);

  if (!settingsProvider) return;

  await generateAssemblerCode(settingsProvider, activeFolder, buildMode, true);
}

function fallbackToInitFolderData() {
  if (activeFolder !== undefined) return activeFolder;

  const currentFile = vscode.window.activeTextEditor?.document.fileName;
  if (!currentFile) return;
  const currentFolder = path.dirname(currentFile);

  activeFolder = currentFolder;
  updateFolderData();

  return activeFolder;
}

async function buildTaskCallback(singleFileBuild: boolean) {
  activeFolder = fallbackToInitFolderData();
  if (activeFolder === undefined) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);

  if (!pathExists(modeDir)) mkdirRecursive(modeDir);

  if (!settingsProvider) return;

  if (singleFileBuild && !settingsProvider.useMsvc) {
    const { files: _, language: language } = getAllSourceFilesSingleFileBased();

    if (
      language === Languages.c &&
      isNonRelativePath(settingsProvider.cCompilerPath)
    ) {
      if (!pathExists(settingsProvider.cCompilerPath)) {
        vscode.window.showErrorMessage(
          "The C compiler (gcc/clang) that you have set does not exist or wasn't installed properly.",
        );
        return;
      }
    }

    if (
      language === Languages.cpp &&
      isNonRelativePath(settingsProvider.cppCompilerPath)
    ) {
      if (!pathExists(settingsProvider.cppCompilerPath)) {
        vscode.window.showErrorMessage(
          "The C++ compiler (g++/clang++) that you have set does not exist or wasn't installed properly.",
        );
        return;
      }
    }
  }

  await executeBuildTask(
    settingsProvider,
    activeFolder,
    buildMode,
    singleFileBuild,
  );
}

async function runTaskCallback() {
  activeFolder = fallbackToInitFolderData();
  if (activeFolder === undefined) return;
  if (!settingsProvider) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);

  const executableName = getExecutableName(
    settingsProvider.operatingSystem,
    buildMode,
  );
  const executablePath = path.join(modeDir, executableName);

  if (!pathExists(modeDir) || !pathExists(executablePath)) {
    vscode.window.showErrorMessage(
      'The executable you want to run does not (yet) exist. You need to build it first.',
    );
    return;
  }

  await executeRunTask(
    activeFolder,
    buildMode,
    argumentsString,
    settingsProvider.operatingSystem,
  );
}

async function cleanTaskCallback() {
  if (
    !settingsProvider ||
    !settingsProvider.operatingSystem ||
    !activeFolder ||
    !workspaceFolder
  ) {
    return;
  }

  await executeCleanTask(
    activeFolder,
    buildMode,
    workspaceFolder,
    settingsProvider.operatingSystem,
  );
}

function debugTaskCallback() {
  if (!workspaceFolder) return;

  activeFolder = fallbackToInitFolderData();
  if (activeFolder === undefined || settingsProvider === undefined) return;

  const modeDir = getBuildModeDir(activeFolder, buildMode);
  const executableName = getExecutableName(
    settingsProvider.operatingSystem,
    buildMode,
  );
  const executablePath = path.join(modeDir, executableName);

  if (!pathExists(modeDir) || !pathExists(executablePath)) {
    vscode.window.showErrorMessage(
      'The executable you want to debug does not (yet) exist. You need to build it first.',
    );
    return;
  }

  runDebugger(activeFolder, workspaceFolder, buildMode, settingsProvider);
}
