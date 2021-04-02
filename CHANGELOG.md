# Change Log

All notable changes to the "c-cpp-runner" extension will be documented in this file.

## [Upcomming Features]

- 0.5.0
  - Output binary with unified name (non dependent on the C/C++ file name)
- 0.6.0
  - Instead launch.json file add task for debugging

## [Releases]

- 0.4.0
  - Added quick pick to select a folder for compiling/running etc.
    - After picking a folder a c_cpp_properties.json and launch.json config file is created
  - Bugfix: When deleting the .vscode folder, no *.json files are created
  - Updated task provider behaviour:
    - Only single file build tasks are present if a C/C++ file is currently opened
    - Only run and clean tasks are present if there is a build folder
  - Added status bar item for build and architecture mode (e.g. Debug - x64)
  - Architecture mode selection works as follows:
    - For x64 compiler: 64bit as -m64 argument
    - For x86 compiler. 32bit as -m32 argument
- 0.3.0 Generating a launch.json configuration for the debug build
- 0.2.0:
  - If not provided, creating a c_cpp_properties.json file for the C/C++ Microsoft extension
  - Added options for include path, additional compiler and linker args
  - Updated Build/Run/Clean tasks
  - Now bundling with webpack for improved performance
- 0.1.0 Added plattform dependent compiler usage
- 0.0.1 First alpha release
