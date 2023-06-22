# C/C++ Runner Change Log

## Version 6.2.0: June 22, 2023

- **Info**: Removed the "_DEBUG" define for debug builds. This caused linker errors with MSVC

## Version 6.1.0: June 9, 2023

- **Info**: Added the "_DEBUG" define for debug builds. Note that release builds have the "NDEBUG" define

## Version 6.0.0: June 6, 2023

- **Info**: Added separate compiler warning setting for MSVC
- **Info**: Added the following sanitizers (GCC/Clang):
  - Undefined Sanitizer
  - Leak Sanitizer

## Version 5.4.0: May 10, 2023

- **Info**: Added c23 standard

## Version 5.3.1: May 03, 2023

- **Info**: Updated README

## Version 5.3.0: April 21, 2023

- **Info**: Added option to show detailed compilation time

## Version 5.2.2: April 21, 2023

- **Bugfx**: Whitespaces in filenames should be no problem anymore

## Version 5.2.1: Mar 29, 2023

- **Bugfx**: Compilation was broken

## Version 5.2.0: Mar 28, 2023

- **Info**: Added Tooltips for Status Bar Items
- **Info**: When there are more than 6 files to compile wildcards are used to prevent a too-long terminal command error
- **Info**: If there is only the root directory in the workspace auto select this as the active folder

## Version 5.1.2: Feb 20, 2023

- **Info**: Better settings descr. for the address sanitizer and fixed the typo

## Version 5.1.1: Feb 20, 2023

- **Info**: Better settings descr. for the address sanitizer
- **Bugfix**: Now the address sanitizer is only run in debug build

## Version 5.1.0: Feb 17, 2023

- **Info**: Fixed status bar colors in white mode
- **Info**: Added address (memory) sanitizer flag for the debug build

## Version 5.0.0: Dec 16, 2022

- **Info**: It is only suggested to edit the settings.json and **not** the launch.json or c_cpp_properties.json file!
- **Change**: Removed change logic: If launch.json is changed the settings.json is not changed anymore
- **Change**: Removed change logic: If c_cpp_properties.json is changed the settings.json is not changed anymore
- **Bugfix**: CMake projects should not activate this extension
- **Bugfix**: Several bugfixes for the msvc/Unix switch

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

## Older Updates

- For older updates see [here](./CHANGELOG_OLD.md)
