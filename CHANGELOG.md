# C/C++ Runner Change Log

## TODO

- In a multi workspace use-case, the settings.json is not stored (needs to be investigated)
- If e.g. a python config is in the launch.json, this is overwritten by the c/c++ entry because the config name is the default name: 'Launch: Debug Program'. Rename it to 'C/C++ Runner: Debug Session'.
- Add command `Shift+Alt+R` to toggle the status bar items

## Version 0.7.0: April 12, 2021

- **Feature**: Added context menu option to select the folder
- **Improvement**: Deactivate extension, if "cmake.sourceDirectory" is set
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
