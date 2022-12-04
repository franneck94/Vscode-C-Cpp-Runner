# Changelog Pre 2.0.0

## Version 1.5.5: November 12, 2021

- **Info**: For Windows users, the paths to the compiler tools are now stored with single slashed "/" instead of double backslashes "\\\\" due to issues with the properties handler of Microsoft's C/C++ extension

## Version 1.5.4: November 10, 2021

- **Bugfix**: Bugfix for settings detection based on c_cpp_properties.json file when there is no local settings.json file present

## Version 1.5.3: November 09, 2021

- **Bugfix**: For a single file task the Compiler, Linker, and Include args are now correctly handled

## Version 1.5.2: October 28, 2021

- **Bugfix**: For a single file task the command line arguments are now passed into the executable call
- **Bugfix**: For single-file tasks, the active folder is now updated

## Version 1.5.1: October 28, 2021

- **Bugfix**: Fixed bug where single file tasks can't be executed when no active folder was selected

## Version 1.5.0: October 27, 2021

- **Improvement**: If the workspace is opened with an existing c_cpp_properties file but no settings.json file, the settings from the properties file are now used for initialization
- **Info**: For Windows users with one of the following conditions, the experimental setting (compiling without Makefile) is now the standard due to several issues in the past:
  - MinGW (e.g. MSYS2) users
  - Space in the username
  - Any space in the filenames of the active folder
- **Info**: Toggle extension keybind command is changed from **ctrl+alt+r** to **ctrl+alt+t**
- **Info**: Commandline arguments keybind command is changed from **ctrl+shift+a** to **ctrl+alt+a**
- **Improvement**: Added following commands for single C/C++ files:
  - Build single file (**ctrl+alt+b**) - **b** for build
  - Run single file (**ctrl+alt+r**) - **r** for run
  - Debug single file (**ctrl+alt+d**) - **d** for debug

## Version 1.4.2: October 25, 2021

- **Info**: Set mac launch config to console and stopAtEntry.

## Version 1.4.1: September 20, 2021

- **Bugfix**: Fixed big for deactivation event with Makefile projects.

## Version 1.4.0: September 18, 2021

- **Improvement**: Updated activation/deactivation logic with the previously called keybinding *toggle status bar* which is now called *toggleExtensionState*. By this command, you can de-/activate the extension for the current workspace. If the extension is deactivated, the setting/properties/launch files won't be re-created on delete.
- **Improvement**: In a workspace with multiple sub-directories, and hence the active folder is not selected on start-up, the settings and properties files are created once the active folder is selected. This speeds up the start-up time for vscode with this extension activated and makes no difference in the usage of this extension.
- **Improvement**: Added command to reset local settings and properties file
- **Bugfix**: Fixed issue for Windows PowerShell users with the experimental setting. Now the CMD is also used to execute the tasks even if the PowerShell is the default terminal.

## Version 1.3.0: August 28, 2021

- **Improvement**: Update gcc/clang search logic, to only search in */usr/* and */usr/bin/* on Linux, and only in paths containing Cygwin, mingw, or msys on windows
- **Improvement**: If the build path contains whitespaces or non-extended ASCII chars the extension's experimental code runner is used instead of Makefile
- **Bugfix**: Fixed using incorrect compiler path in the experimental setting

## Version 1.2.0: August 25, 2021

- **Feature**: Added pretty print for gdb in debug (launch) configuration

## Version 1.1.5: August 16, 2021

- **Bugfix**: Fixed problem with empty arguments for executing the binary on windows with mingw compiler

## Version 1.1.4: August 15, 2021

- **Bugfix**: Fixed problem with Linker Args
- **Info**: Updated README

## Version 1.1.3: July 27, 2021

- **Bugfix**: Fixed problem with Makefile in .vscode folder (regarding my Udemy Courses setup)

## Version 1.1.2: July 26, 2021

- **Bugfix**: Updated run task for windows such that the executable name has .exe file extension since this is needed for MinGW
- **Bugfix**: Fixed bug that debugging the release build was not possible

## Version 1.1.1: July 26, 2021

- **Improvement**: Creating and deleting the build folder is now executed by the extension code and not anymore by the Makefile

## Version 1.1.0: July 24, 2021

- **Feature**: Added experimental setting to run compiler commands without Makefile

## Version 1.0.2: July 9, 2021

- **Bugfix**: Fixed bug for compiler search on Linux and Mac

## Version 1.0.1: July 4, 2021

- **Info**: Added information message if a path has whitespaces. Makefile can not work with paths/filenames with whitespaces properly.

## Version 1.0.0: July 3, 2021

- **Improvement**: Following settings are now array of strings instead of strings:
  - `C_Cpp_runner.warnings`
  - `C_Cpp_runner.includePaths`
  - `C_Cpp_runner.compilerArgs`
  - `C_Cpp_runner.linkerArgs`

So for example previously we used:

```json
{
  "C_Cpp_Runner.warnings": "-Wall -Wextra -Wpedantic"
}
```

This would now be:

```json
{
  "C_Cpp_Runner.warnings": [
    "-Wall",
    "-Wextra",
    "-Wpedantic"
  ]
}
```

- All settings are now stored in the local `.vscode/settings.json` file

## Version 0.17.1: June 16, 2021

- **Bugfix**: Bugfix for passing multiple include paths

## Version 0.17.0: June 13, 2021

- **Improvement**: Added option for glob patterns to exclude from the selected folder search
- **Bugfix**: Bugfix for configuration triplet

## Version 0.16.2: June 12, 2021

- **Bugfix**: Bugfix for configuration triplet

## Version 0.16.1: June 12, 2021

- **Bugfix**: Several bug fixes for Linux/mac

## Version 0.16.0: June 12, 2021

- **Improvement**: Updating c_cpp_properties.json and launch.json do trigger an update for settings.json. Hence, the user can edit any of these files and all other files are updated accordingly.
- **Improvement**: Updated compiler search on windows, to speed up the process.
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
- **Important Info**: Removed `ctrl+shift+r` keybinding for the tasks dropdown menu. If the user does not want to use the status bar items, the commands can be executed from the command palette.
- **Info**: Removed extension activation "onDebugResolve:c/cpp" since the debugging is not triggered by the user anyway.
- **Info**: Removed extension activation  "workspaceContains:.vscode/c_cpp_properties.json" since this may result in extension activations where the user does not intend to use c/cpp code.

## Version 0.13.0: May 19, 2021

- **Improvement**: Selected folder path is shortened in the status bar.
- **Improvement**: Remove x86/x64 architecture from build mode. The user should rather select an appropriate x86 or x64 compiler in the settings.
- **Improvement**: The default c and cpp standard is now the compiler's default.
- **Improvement**: Improved lookup performance for installed software.

## Version 0.12.1: May 10, 2021

- **Bugfix**: Fixed naming "C_cpp_Properties.json" to "c_cpp_properties.json".

## Version 0.12.0: May 09, 2021

- **Info**: Extension does not show up if a Makefile is present in the root directory of the workspace or inside the .vscode folder of the workspace.

## Version 0.11.0: May 04, 2021

- **Improvement**: The settings are now read/saved correctly in a use case with multiple workspaces.
A multi-workspace setting is now fully compatible with the extension.
- **Bugfix**: External console is now set to false for Mac due to debugging issues.
- **Bugfix**: In a multi-root workspace use case the cmake detection is now working properly.

## Version 0.10.0: April 26, 2021

- **Info**: Updated display logic of status bar items. For more info see the [here](./README.md)
- **Info**: Added logging entries
- **Info**: Updated project structure

## Version 0.9.1: April 23, 2021

- **Bugfix**: Major bugfix of tasks were not working

## Version 0.9.0: April 23, 2021

- **Bugfix**: Makefile issue with Windows/MinGW
- **Info**: Added try/catch clauses to all IO related functions
- **Info**: Added logger to log certain info/errors. Also added the setting loggingActive to activate the logger

## Version 0.8.2: April 19, 2021

- **Bugfix**: Set debug console to external for lldb (MacOS) - see: [github issue](https://github.com/microsoft/vscode-cpptools/issues/5079)
- **Bugfix**: Makefile arguments that can hold multiple values are now passed with "" instead of ''
- **Bugfix**: In a multi-root workspace use case, the file watchers were not updated to a new selected workspace (on workspace change)
- **Info**: In a multi-root workspace use case, the extension's settings are stored in the '.code-workspace' file

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
- **Feature**: Select the root folder automatically, if this is the only folder in the workspace
- **Bugfix**: Corrected packing with webpack
- **Bugfix**: settings.json is now re-created on delete event
- **Info**: Added Microsoft's C/C++ extension as "extensionDependencies" entry
- **Info**: Updated README for an easier introduction

## Version 0.5.3: April 5, 2021

- **Feature**: Added search for "mingw32-make" for MinGW users
- **Feature**: Updated makefile for Windows users without Cygwin/MSYS installed
- **Info**: Removed Microsoft's C/C++ extension as an "extensionPack" entry, since deactivating/uninstalling this extension would also do so for the Microsoft ones
- **Bugfix**: The extension couldn't start after installing

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
