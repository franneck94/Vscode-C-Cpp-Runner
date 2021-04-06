# Change Log

All notable changes to the "c-cpp-runner" extension will be documented in this file.

## [Upcomming Features]

- 0.6.0: TBD

## [Releases]

- 0.5.3
  - Added search for "mingw32-make" for MinGW users
  - Updated makefile for Windows user without Cygwin/MSYS installed
  - Removed Microsoft's C/C++ extension as "extensionPack" entry, since deactivating/uninstalling this extension would also do so for the Microsoft ones
  - Critical bugfix: Extension couldnt start after installing
- 0.5.2
  - Added Microsoft's C/C++ extension as "extensionPack" entry
- 0.5.1
  - Fixed critical bug of getting the extension's root dir
- 0.5.0
  - Added new buttons to the status bar for: Build, Run and Debug
  - Added task for debugging to the tasks list (ctrl+shift+r)
  - Bugfix: If the root directory has code and there is no sub-dir, no dir can be selected
  - Improvement: Corrected path to the binary in the launch.json file
  - New activation command for extension: .vscode/c_cpp_properties.json is present in workspace
- 0.4.0
  - Added quick pick to select a folder for compiling/running etc.
    - After picking a folder a c_cpp_properties.json and launch.json config file is created
  - Added status bar item for build and architecture mode (e.g. Debug - x64)
    - Architecture mode selection works as follows:
      - For 64bit compiler: -m64 compiler argument
      - For 32bit compiler: -m32 compiler argument
  - Bugfix: When deleting the .vscode folder, no *.json files are created
  - Updated task provider behaviour:
    - Only provide tasks if the user has selected a working directory
    - Only run and clean tasks are provided if there is a build folder in the selected working directory
  - Output binary with unified name (non dependent on the C/C++ file name), always called outDebug (.exe for windows)
- 0.3.0 Generating a launch.json configuration for the debug build
- 0.2.0:
  - If not provided, creating a c_cpp_properties.json file for the C/C++ Microsoft extension
  - Added options for include path, additional compiler and linker args
  - Updated Build/Run/Clean tasks
  - Now bundling with webpack for improved performance
- 0.1.0 Added plattform dependent compiler usage
- 0.0.1 First alpha release
