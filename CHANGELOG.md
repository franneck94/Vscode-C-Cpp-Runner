# Change Log

All notable changes to the "c-cpp-runner" extension will be documented in this file.

## [Upcomming Features]

- 0.5.0
  - Output binary with unified name (non dependent on the C/C++ file name)
- 0.6.0
  - Instead launch.json file add task for debugging

## [Releases]

- 0.4.0
  - Added quick pick in a multi root use-case, to initialize a certain folder
    - Initialize means: Create c_cpp_properties.json and launch.json for the given config
  - Bugfix: When deleting the .vscode folder, no *.json files are created
  - Major refactoring with advanced eslint settings
  - Updated task provider behaviour:
    - Only single file build tasks are present if a C/C++ file is currently opened
    - Only run and clean tasks are present if there is a build folder in the workspace
  - Now the user can select debug or release build as a status bar item
- 0.3.0 Generating a launch.json configuration for the debug build
- 0.2.0:
  - If not provided, creating a c_cpp_properties.json file for the C/C++ Microsoft extension
  - Added options for include path, additional compiler and linker args
  - Updated Build/Run/Clean tasks
  - Now bundling with webpack for improved performance
- 0.1.0 Added plattform dependent compiler usage
- 0.0.1 First alpha release
