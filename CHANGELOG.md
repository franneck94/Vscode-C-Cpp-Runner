# C/C++ Runner Change Log

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

- **Info**: Added check for windows system drive

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
- **Info**: Clang on windows (backed by MSVC) will also use the MSVC debuggee type
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

## Version 3.1.0: January 19, 20212

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

- **Info**: On windows, the paths in the launch.json file are now stored with "/" instead of "\\"
- **Info**: On windows, the commands are now always launched in an extra CMD instance

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

## Older Updates

- For older updates see [here](./CHANGELOG_OLD.md)
