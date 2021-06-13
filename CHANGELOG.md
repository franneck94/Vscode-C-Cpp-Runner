# C/C++ Runner Change Log

## Version 0.17.0: June 13, 2021

- **Improvement**: Added option for glob patterns to exclude from the selected folder search
- **Bugfix**: Bugfix for configuration triplet

## Version 0.16.2: June 12, 2021

- **Bugfix**: Bugfix for configuration triplet

## Version 0.16.1: June 12, 2021

- **Bugfix**: Several bug fixes for linux/mac

## Version 0.16.0: June 12, 2021

- **Improvement**: Updating c_cpp_properties.json and launch.json do trigger an update for settings.json. Hence, the user can edit any of these files and all other files are updated accordingly.
- **Improvement**: Updated compiler search on windows, to speed-up the process.
- **Info**: Added some unit tests. Will be extended in the future.
- **Bugfix**: Several bug fixes

## Version 0.15.0: June 7, 2021

- **Info**: If settings/properties were configured e.g. windows and the project is opened in for example Linux, the commands (compiler, etc.) are searched again and stored in the settings.json/c_cpp_properties.json file
- **Bugfix**: Fixed extension crash

## Version 0.14.2: June 3, 2021

- **Info**: When using cygwin64 the intellisense triplet is changed to "Linux" due to the following [issue](https://github.com/microsoft/vscode-cpptools/issues/7637).

## Version 0.14.1: June 1, 2021

- **Bugfix**: Fixed crash when no compiler was found
- **Info**: Do not list folders in the selection that contain '__' (2 underscores)
- **Info**: Do not list folders that are named 'build' (equality check)
- **Info**: Added x64 as default architecture

## Version 0.14.0: May 26, 2021

- **Feature**: Added option to pass arguments to the binary for running and debugging. Users can set the arguments by the new keybinding `ctrl+shift+a`.
- **Bugfix**: Fixed bug for shortened folder path in the status bar.
- **Important Info**: Removed `ctrl+rshift+r` keybinding for the tasks dropdown menu. If the user does not want to use the status bar items, the commands can be executed from the command palette.
- **Info**: Removed extension activation "onDebugResolve:c/cpp" since the debugging is not triggered by the user anyway.
- **Info**: Removed extension activation  "workspaceContains:.vscode/c_cpp_properties.json" since this may result in extension activations where the user does not intend to use c/cpp code.

## Version 0.13.0: May 19, 2021

- **Improvement**: Selected folder path is shortened in the status bar.
- **Improvement**: Remove x86/x64 architecture from build mode. The user should rather select an appropriate x86 or x64 compiler in the settings.
- **Improvement**: Default c and cpp standard is now the compiler's default.
- **Improvement**: Improved lookup performance for installed software.

## Version 0.12.1: May 10, 2021

- **Bugfix**: Fixed naming "C_cpp_Properties.json" to "c_cpp_properties.json".

## Version 0.12.0: May 09, 2021

- **Info**: Extension does not show up if a Makefile is present in the root directory of the workspace or inside the .vscode folder of the workspace.

## Version 0.11.0: May 04, 2021

- **Improvement**: The settings are now read/saved correctly in a use case with multiple workspaces.  
A multi-workspace setting is now fully compatible with the extension.
- **Bugfix**: External console is now set to false for Mac due to debugging issues.
- **Bugfix**: In a multi-root workspace use-case the cmake detection is now working properly.

## Version 0.10.0: April 26, 2021

- **Info**: Updated display logic of status bar items. For more info see the [here](./README.md)
- **Info**: Added logging entries
- **Info**: Updated project structure

## Version 0.9.1: April 23, 2021

- **Bugfix**: Major bugfix of tasks were not working

## Version 0.9.0: April 23, 2021

- **Bugfix**: Makefile issue with Windows/MinGW
- **Info**: Added try/catch clauses to all IO related functions
- **Info**: Added logger to log certain info/errors. Also added setting loggingActive to activate the logger

## Version 0.8.2: April 19, 2021

- **Bugfix**: Set debug console to external for lldb (MacOS) - see: [github issue](https://github.com/microsoft/vscode-cpptools/issues/5079)
- **Bugfix**: Makefile arguments that can hold multiple values are now passed with "" instead of ''
- **Bugfix**: In a multi-root workspace use-case, the file watchers were not updated to a new selected workspace (on workspace change)
- **Info**: In a multi-root workspace use-case, the extension's settings are stored in the '.code-workspace' file

## Version 0.8.1: April 14, 2021

- **Bugfix**: Commands are now callable if the extension is not activated
- **Bugfix**: Now the correct debug config is used
- **Bugfix**: Removed bug that the debug task was always executed when the selected folder has "debug" in its name
- **Improvement**: Now filtering only the target files on delete events
- **Info**: Toggle status bar command changes to `Ctrl+Alt+R`
- **Info**: Added toggle command description to README

## Version 0.8.0: April 14, 2021

- **Feature**: Added command `Shift+Alt+R` to toggle (hide/show) the status bar items
- **Improvement**: Renamed launch (debug) config to 'C/C++ Runner: Debug Session'
- **Bugfix**: Fixed bug of passing the warnings flags to the Makefile
- **Info**: Folders with a '.' in their name are not displayed in the folder quick pick menu

## Version 0.7.0: April 12, 2021

- **Feature**: Added context menu option to select the folder
- **Feature**: Deactivate extension, if "cmake.sourceDirectory" is set
- **Improvement**: Added events for a selected folder on a name change and delete
- **Bugfix**: Fixed behavior of settings/launch/c_cpp_properties.json files if these were already present without the extension entries
- **Bugfix**: Fixed makefile issue when 'Warnings' is an empty string
- **Info**: Updated C Standard default to c99
- **Info**: Update README regarding context menu

## Version 0.6.2: April 11, 2021

- **Bugfix**: Fixed file watcher for single root folder use-case
- **Improvement**: Now sorting the folder list by localeCompare ordering
- **Improvement**: Compilers are searched in the PATH just once on extension start and not re-searched after deleting the local settings.json file

## Version 0.6.1: April 10, 2021

- **Bugfix**: Fixed file watcher for single root folder use-case

## Version 0.6.0: April 9, 2021

- **Feature**: Removed extension activation when CMakeLists.txt is present in the root folder of the workspace
- **Feature**: Select root folder automatically, if this is the only folder in the workspace
- **Bugfix**: Corrected packing with webpack
- **Bugfix**: settings.json is now re-created on delete event
- **Info**: Added Microsoft's C/C++ extension as "extensionDependencies" entry
- **Info**: Updated README for an easier introduction

## Version 0.5.3: April 5, 2021

- **Feature**: Added search for "mingw32-make" for MinGW users
- **Feature**: Updated makefile for Windows user without Cygwin/MSYS installed
- **Info**: Removed Microsoft's C/C++ extension as "extensionPack" entry, since deactivating/uninstalling this extension would also do so for the Microsoft ones
- **Bugfix**: Extension couldn't start after installing

## Version 0.5.2: April 5, 2021

- **Info**: Added Microsoft's C/C++ extension as "extensionPack" entry

## Version 0.5.1: April 5, 2021

- **Bugfix**: Fixed critical bug of getting the extension's root dir

## Version 0.5.0: April 4, 2021

- **Feature**: Added new buttons to the status bar for: Build, Run, and Debug
- **Feature**: Added a task for debugging to the tasks list (ctrl+shift+r)
- **Bugfix**: If the root directory has code and there is no sub-dir, no dir can be selected
- **Bugfix**: Corrected path to the binary in the launch.json file
- **Feature**: New activation command for extension: .vscode/c_cpp_properties.json is present in workspace

## Version 0.4.0: April 3, 2021

- **Feature**: Added quick pick to select a folder for compiling/running etc.
  - After picking a folder a c_cpp_properties.json and launch.json config file is created
- **Feature**: Added status bar item for build and architecture mode (e.g. Debug - x64)
  - Architecture mode selection works as follows:
    - For 64bit compiler: -m64 compiler argument
    - For 32bit compiler: -m32 compiler argument
- **Bugfix**: When deleting the .vscode folder, no \*.json files are created
- **Feature**: Updated task provider behavior:
  - Only provide tasks if the user has selected a working directory
  - Only run and clean tasks are provided if there is a build folder in the selected working directory
- **Feature**: Output binary with unified name (non-dependent on the C/C++ file name), always called outDebug (.exe for windows)

## Version 0.3.0: April 1, 2021

- **Feature**: Generating a launch.json configuration for the debug build

## Version 0.2.0: March 31, 2021

- **Feature**: If not provided, creating a c_cpp_properties.json file for the C/C++ Microsoft extension
- **Feature**: Added options for the include path, additional compiler, and linker args
- **Feature**: Updated Build/Run/Clean tasks
- **Info**: Now bundling with webpack for improved performance

## Version 0.1.0: March 29, 2021

- **Feature**: Added platform-dependent compiler usage

## Version 0.0.1: March 23, 2021

- **Info**: First alpha Version
