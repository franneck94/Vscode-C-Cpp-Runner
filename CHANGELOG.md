# C/C++ Runner Change Log

## Version 9.0.0: Sep 01, 2023

- **Info**: Huge internal refactoring
- **Info**: Added option for MSVC to deactivate safety warnings about functions like scanf, printf etc.
- **TODO**: Upcomming feature: open the generated assembler file to the side

## Version 8.1.0: Aug 08, 2023

- **Info**: Added LTO for Cuda Code
- **Info**: Added Compile Time Info for Cuda Code

## Version 8.0.0: Aug 08, 2023

- **Info**: Added the ability to compile Cuda (.cu) code with the Cuda NVCC compiler
- **Info**: Removed some keyboard shortcuts
- **Info**: Trigger error message window when the user wants to run or debug a non-existing executable

## Version 7.1.0: Jul 31, 2023

- **Info**: Added Run and Debug Single File Action to the play button in the upper right corner

## Version 7.0.4: Jul 24, 2023

- **Info**: Updated README.md

## Version 7.0.3: Jul 20, 2023

- **Info**: Updated README.md

## Version 7.0.2: June 30, 2023

- **Info**: Only use the LTO flag when there are multiple translation units

## Version 7.0.1: June 29, 2023

- **Info**: Updated README.md

## Version 7.0.0: June 29, 2023

- **Info**: Added command to generate assembler code for currently viewed c/c++ file. Currently, it's only working for single-file examples
- **Info**: Added useAddressSanitizer flag to optimize builds in release mode
- **Info**: Refactored README.md

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

## Older Updates

- For older updates, see [here](./CHANGELOG_OLD.md)
