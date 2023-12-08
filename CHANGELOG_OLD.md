# Changelog Pre 5.0.0

## Version 4.3.1: Dec 4, 2022

- **Bugfix**: Fixed bug for single file compile if C **and** C++ files are in the same directory

## Version 4.3.0: Nov 30, 2022

- **Info**: Added keyboard shortcut for building the currently selected folder: *ctrl+b*

## Version 4.2.3: Nov 28, 2022

- **Info**: Added more default warnings

## Version 4.2.2: Nov 27, 2022

- **Info**: Removed c++latest option, since MS C++ extension does not support this anyway
- **Info**: Improved default compiler for Mac

## Version 4.2.1: Nov 24, 2022

- **Bugfix**: Now only using LLDB debug extension on Mac

## Version 4.2.0: Nov 6, 2022

- **Info**: Added more default warnings
- **Info**: Added c++std option "c++latest" for MSVC

## Version 4.1.4: Nov 14, 2022

- **Bugfix**: Bugfix for relative paths in the problems tab

## Version 4.1.3: Nov 1, 2022

- **Info**: Added donation link

## Version 4.1.2: Oct 11, 2022

- **Bugfix**: MSVC C++ standard bugfix

## Version 4.1.1: Oct 04, 2022

- **Bugfix**: MSVC c standard bugfix
- **Bugfix**: Added problems output again
- **Info**: MSVC Default C Standard is now C11

## Version 4.1.0: Oct 03, 2022

- **Info**: Better default value for MSVC, by scanning for installed VS

## Version 4.0.7: Sep 12, 2022

- **Info**: Added check for Windows system drive

## Version 4.0.6: Sep 11, 2022

- **Bugfix**: Bug fixes for compiler detection

## Version 4.0.5: Sep 08, 2022

- **Bugfix**: Fixed build error with default include paths

## Version 4.0.4: Aug 21, 2022

- **Bugfix**: On windows gcc, the external console for debugging is true
- **Bugfix**: Fixed issue with MIDebuggerPath on Mac with non-ARM chip

## Version 4.0.3: May 24, 2022

- **Info**: Updated README
- **Regression**: Removed include paths sync with Microsoft's extension, the user should rather set the include paths settings value of this extension

## Version 4.0.2: May 23, 2022

- **Regression**: Fixed properties <=> settings sync bugs

## Version 4.0.1: May 22, 2022

- **Regression**: Fixed failing msvc compilation with multiple source files
- **Regression**: Fixed properties <=> settings sync bug

## Version 4.0.0: May 17, 2022

- **Info**: Major update about the settings handling. Now, the global (default) settings are used to generate the local .vscode settings files, instead of searching for any compiler installation on your computer. If you do not set an absolute compiler path in the settings, it is expected to have the compiler in the PATH variables (like calling `gcc` in the terminal).
- **Info**: Added boolean flag setting **useMsvc** to indicate if the user wants to use MSVC instead of GCC/Clang in the current workspace.
- **Info**: Clang on Windows (backed by MSVC) will also use the MSVC debuggee type
- **Info**: Updated settings.json <=> c_cpp_properties.json sync:
  - **Only** Only syncing: C/C++ compiler path, C/C++ standard and include paths

## Version 3.4.0: May 4, 2022

- **Info**: Shortened the msvc commands to have a better overview of the executed command
- **Info**: Added currently known problems list to the README

## Version 3.3.0: April 14, 2022

- **Info**: For debugging the internal console is now used on all operating systems
- **Info**: Removed not working logging

## Version 3.2.4: March 24, 2022

- **Regression**: Fixed MSVC compiling issue

## Version 3.2.3: March 22, 2022

- **Bugfix**: Fixed cmd argument bugs
- **Bugfix**: Fixed double folder entries in folder selection

## Version 3.2.2: March 6, 2022

- **Internal**: Removed task provider
- **Regression**: Fixed CMD arguments bug with whitespaces

## Version 3.2.1: March 5, 2022

- **Regression**: Fixed problem with whitespaces in workspace dir

## Version 3.2.0: March 5, 2022

- **Info**: Now using relative paths for building the binary, hence the console output is shortened and more readable
- **Bugfix**: Hotfix since the extension was not working anymore with VSCode 1.65.0

## Version 3.1.1: January 31, 2022

- **Info**: Updated MSVC instructions

## Version 3.1.0: January 19, 2022

- **Info**: Removed Makefile deactivation
- **Info**: Updated README

## Version 3.0.0: December 31, 2021

- **Feature**: MSVC Compiler Support
  - Add Compiler Commands
  - Add Setting for MSVC Batch Path
    - E.g.: "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvarsall.bat"
  - MSVC Host/Target architecture is equal to current architecture
  - Added debug config for MSVC
  - Default warning level for MSVC is **/W4**, this will be set if MSVC "mode" is active
  - Default C version is c17 for MSVC
- **Info**: Removed warnings from compiler args in c_cpp_properties.json
- **Feature**: Updated logic for excluding patterns for folder selection
- **Feature**: Added Include pattern for folder selection

## Version 2.1.1: December 21, 2021

- **Bugfix**: Now passing linker args after the object files

## Version 2.1.0: December 07, 2021

- **Info**: Load global *C_Cpp.default.includePath* setting for the extensions *includePaths*
- **Bugfix**: Opening a project for the first time with the C/C++ Runner extension and an already existing c_cpp_properties.json file, the compiler args are now correctly read-in.

## Version 2.0.5: November 29, 2021

- **Info**: Updated README
- **Info**: Now using the internal console for debugging on Mac M1
- **Bugfix**: Command-line arguments are now stored in a single line in launch.json's args array, thus whitespaces in the arguments are handled correctly

## Version 2.0.4: November 23, 2021

- **Info**: On Windows, the paths in the launch.json file are now stored with "/" instead of "\\"
- **Info**: On Windows, the commands are now always launched in an extra CMD instance

## Version 2.0.3: November 22, 2021

- **Regression Bugfix**: Fixed issue with cmd arguments

## Version 2.0.2: November 22, 2021

- **Bugfix**: Fixed issue for ARM64 Mac user

## Version 2.0.1: November 17, 2021

- **Regression Bugfix**: Fixed issue for handling whitespaces in paths

## Version 2.0.0: November 16, 2021

- **Info**: Makefile is not used anymore and hence it is no dependency, instead all commands are directly executed with VSCode's task API
- **Info**: Added C++23 Standard to **C_Cpp_Runner.cppStandard** setting
- **Improvement**: Added shortcut for active folder selection **ctrl+alt+f**
- **Improvement**: Added shortcut for build mode selection **ctrl+alt+g**
- **Info**: Added **vadimcn.vscode-lldb** as an extension dependency since this will be used for debugging on Mac with an M1 chip
- **Info**: Updated debug target on MacOS with an ARM chip

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

- **Bugfix**: Fixed bug for deactivation event with Makefile projects.

## Version 1.4.0: September 18, 2021

- **Improvement**: Updated activation/deactivation logic with the previously called keybinding *toggle status bar* which is now called *toggleExtensionState*. By this command, you can de-/activate the extension for the current workspace. If the extension is deactivated, the setting/properties/launch files won't be re-created on delete.
- **Improvement**: In a workspace with multiple sub-directories, and hence the active folder is not selected on start-up, the settings and properties files are created once the active folder is selected. This speeds up the start-up time for vscode with this extension activated and makes no difference in the usage of this extension.
- **Improvement**: Added command to reset local settings and properties file
- **Bugfix**: Fixed issue for Windows PowerShell users with the experimental setting. Now the CMD is also used to execute the tasks even if the PowerShell is the default terminal.

## Version 1.3.0: August 28, 2021

- **Improvement**: Update gcc/clang search logic, to only search in */usr/* and */usr/bin/* on Linux, and only in paths containing Cygwin, mingw, or msys on Windows
- **Improvement**: If the build path contains whitespaces or non-extended ASCII chars the extension's experimental code runner is used instead of Makefile
- **Bugfix**: Fixed using incorrect compiler path in the experimental setting

## Version 1.2.0: August 25, 2021

- **Feature**: Added pretty print for gdb in debug (launch) configuration

## Version 1.1.5: August 16, 2021

- **Bugfix**: Fixed problem with empty arguments for executing the binary on Windows with mingw compiler

## Version 1.1.4: August 15, 2021

- **Bugfix**: Fixed problem with Linker Args
- **Info**: Updated README

## Version 1.1.3: July 27, 2021

- **Bugfix**: Fixed problem with Makefile in .vscode folder (regarding my Udemy Courses setup)

## Version 1.1.2: July 26, 2021

- **Bugfix**: Updated run task for Windows such that the executable name has .exe file extension since this is needed for MinGW
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

- **Improvement**: Following settings are now an array of strings instead of strings:
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
- **Improvement**: Updated compiler search on Windows, to speed up the process.
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
- **Info**: Added try/catch clauses to all IO-related functions
- **Info**: Added logger to log certain info/errors. Also added the setting loggingActive to activate the logger

## Version 0.8.2: April 19, 2021

- **Bugfix**: Set debug console to external for lldb (MacOS) - see: [github issue](https://github.com/microsoft/vscode-cpptools/issues/5079)
- **Bugfix**: Makefile arguments that can hold multiple values are now passed with "" instead of ''
- **Bugfix**: In a multi-root workspace use case, the file watchers were not updated to a newly selected workspace (on workspace change)
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
- **Info**: Folders with a '.' in their name is not displayed in the folder quick pick menu

## Version 0.7.0: April 12, 2021

- **Feature**: Added context menu option to select the folder
- **Feature**: Deactivate extension, if "cmake.sourceDirectory" is set
- **Improvement**: Added events for a selected folder on a name change and delete
- **Bugfix**: Fixed behavior of settings/launch/c_cpp_properties.json files if these were already present without the extension entries
- **Bugfix**: Fixed makefile issue when 'Warnings' is an empty string
- **Info**: Updated C Standard default to c99
- **Info**: Update README regarding the context menu

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
- **Bugfix**: settings.json is now re-created on the delete event
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
- **Feature**: Output binary with unified name (non-dependent on the C/C++ file name), always called outDebug (.exe for Windows)

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
