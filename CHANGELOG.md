# Change Log

All notable changes to the "c-cpp-runner" extension will be documented in this file.

## [Upcomming Features]

- 0.5.0
  - Bugfix: If the root directory has code and there is no sub-dir, no dir can be selected
  - Add new buttons to the status bar: Build, Run, Debug button
- 0.6.0
  - Instead launch.json file add task for debugging
  - Bugfix: Now check implemented to see if a compiler supports 32 *and* 64 bit.

## [Releases]

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
