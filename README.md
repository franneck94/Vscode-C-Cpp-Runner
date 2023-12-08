# VSCode C/C++ Runner

🚀 Compile, run and debug [**single**](#compile-a-single-file) or [**multiple**](#compile-all-files-in-one-folder) C/C++/Cuda files with ease. 🚀  
You do not need to know about any compiler commands. 😎

## Example

![ExampleGif](./media/ExecuteTasks.gif?raw=true)

## Software Requirements

- 🔧 Any GCC, Clang, MSVC or Cuda NVCC compiler

Make sure that your GCC/Clang compiler is either in your [PATH](https://superuser.com/a/284351) or you have to manually set the **C/C++ Compiler** setting of this extension.  
For Windows Users that want to use the [Visual Studio compiler](https://visualstudio.microsoft.com/) (called **MSVC**) see instructions [here](#using-the-msvc-compiler).  
For Cuda code the **NVCC** Compiler will be automatically called.

## The Extension automatically activates when

- There is a C/C++ file in the **root** directory of your workspace
- You open a C/C++ file in your workspace

## Compile a single file

1️⃣ Open the C/C++ file you want to compile (build).  
2️⃣ Select either debug or release mode for building the binary (debug is the default case).  
3️⃣ To build the binary press **ctrl+alt+b**.  
4️⃣ To run the binary press **ctrl+alt+r**, or you can click on the play icon in the status bar down below.  
5️⃣ To debug the binary press **ctrl+alt+d**, or you can click on the bug icon in the status bar down below.  

## Compile all files in one folder

1️⃣ Select the folder that contains the C/C++ files you want to compile.  
You can select the folder by the quick pick menu from the status bar.  
![TaskStatusBar](./media/FolderStatusBar.png)  
2️⃣ Optional: Select either debug or release mode for building the binary (debug is the default case).  
![TaskStatusBar](./media/ModeStatusBar.png)  
3️⃣ Now you can build/run/debug the binary.  
![TaskStatusBar](./media/TaskStatusBar.png)

- ⚙️ Build: This task will compile all C/C++ files in the selected folder and will link them into a binary.  
- ▶️ Run*: This task will execute the built binary.  
- 🗑️ Clean*: This helper task will delete all files in the build dir.
- 🐞 Debug*: This task will start a debugging session for the binary.  

*This task is a no-op if the build task was not executed previously.

## Basic Features

### Configuration

The configuration settings will be stored **locally** in *".vscode/settings.json"*.  
![FoundCompiler](./media/Settings.png)  

Based on that, the local *".vscode/c_cpp_properties.json"* file is created.  
It will be used by [Microsoft's *C/C++*](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference) extension for intellisense (auto-completion etc.).  
Note: You **don't** have to edit the **c_cpp_properties.json** file.  

### Basic settings

- ⚙️ C Compiler Path (string, defaults to \"gcc\")
- ⚙️ C Standard (string, defaults to the compiler's default, e.g. "c99")
- ⚙️ C++ Compiler Path (string, defaults to \"g++\")
- ⚙️ C++ Standard (string, defaults to the compiler's default, e.g. "c++20")
- ⚙️ Debugger Path (string, defaults to \"gdb\")
- ⚙️ MSVC Batch Path (string, defaults to \"\")
- ⚙️ Use MSVC (boolean, defaults to false)
- ⚙️ To enable Compiler Warnings (boolean, defaults to True)
- ⚙️ GCC/Clang [Compiler Warnings](https://clang.llvm.org/docs/DiagnosticsReference.html) (string array, e.g. "-Wall")
- ⚙️ MSVC [Compiler Warnings](https://learn.microsoft.com/en-us/cpp/error-messages/compiler-warnings/compiler-warnings-by-compiler-version?view=msvc-170) (string array, e.g. "\W4")
- ⚙️ To treat Warnings as Errors (boolean, defaults to False)
- ⚙️ To disable MSVC Security Warnings (boolean, defaults to False)

## Using the MSVC Compiler

To use the **Visual Studio MSVC** compiler, e.g. VS2022, set the **msvcBatchPath** setting to a valid path.  
As an example installation path of the compiler:  
**"C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvarsall.bat"**.  
Then set the **useMsvc** extension setting to true, to use MSVC and not GCC/Clang.  
If you want to stop using the MSVC compiler, just set **useMsvc** to false.  
⚠️ Only the 64-bit (no cross-compiling) version of MSVC is supported.  
⚠️ The extension is only tested for VS2019 and VS2022.  
⚠️ For auto detecting the installed VS you have to install it in **C:/Program Files/Microsoft Visual Studio**

## Advanced Features

### Passing Commandline Arguments

You can pass in command-line arguments for running or debugging the binary.  

![Alt text](./media/cmdArgs.png)

Make sure to select the active folder that should be compiled beforehand.  
Then press `ctrl+alt+a` to open the message box to type in the arguments:

![Arguments](./media/arguments.png)

These arguments will be stored in the launch.json config for debugging the binary.  

![ArgumentsDebug](./media/argumentsDebug.png)

If you now run or debug your program these values will be fed into **argc**/**argv**.  
Important: The stored arguments will be reset after selecting a new active folder.  
Note: For strings with whitespaces please use \" (not single \').

### Include & Exclude Folders for Selection

You can add [glob](https://en.wikipedia.org/wiki/Glob_(programming)#Syntax) patterns to include and exclude folders from the folder selection.  
Note: The include pattern is used before the exclude pattern.

For example with the following exclude glob pattern:

![ExcludePattern](./media/excludePattern.png)

The folder selection would change from left to right.

![ExcludePaths1](./media/excludePaths1.png)
![ExcludePaths2](./media/excludePaths2.png)

### Generate Assembler Code

When executing the command: **Generate Assembler Code**.  
The assembler code will be generated in a **.s** file that will be in the build directory next to the executable.  
👷🏻 Note: Currently, this feature is experimental and only works for single-file builds.  

### Advanced Settings

- **If** the compiler has it implemented and only in **debug build**
  - ⚙️ Activate the [address sanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
  - ⚙️ Activate the [undefined sanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
  - ⚙️ Activate the [leak sanitizer](https://clang.llvm.org/docs/LeakSanitizer.html)
- ⚙️ Show detailed Information about the Compilation Time
- ⚙️ Use link time optimization for release builds
- ⚙️ Compiler Arguments (string array, e.g. **\[\"-pthreads\"\]**)
- ⚙️ Linker Arguments (string array, e.g. **\[\"-lpthread\"\]**).
  - Note: It is **expected** to prefix the arguments with the appropriate flags (e.g. -l or -L for Gcc/Clang)
- ⚙️ Include Paths (string array, e.g. **\[\"path/to/headers/\"\]**)
  - Note: It is **not (!) expected** to prefix the arguments with the **-I** or **/I** flag
- ⚙️ Include Glob Pattern for the Folder Selection (string array, defaults to **["\*", "\*\*/\*"]**)
- ⚙️ Exclude Glob Pattern for the Folder Selection (string array, defaults to **["\*\*/build", "\*\*/.\*", "\*\*/.vscode",]**)

## Important Notes

### Constraints with Files and Folders

- 📝 File extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- 📝 File extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx
- ⚠️ Include paths and file names with whitespaces and special characters (e.g. &) can make the compilation fail

### CMake Projects in the Workspace Directory

The extension buttons are hidden if there is a CMakeLists.txt in the workspace root directory.  
This prevents an overloaded status bar with a lot of icons due to Microsoft's CMake extension.  
However, the user can trigger the start-up of this extension by executing the command: **Toggle extension buttons in status bar**.

## Release Notes

Refer to the [CHANGELOG](CHANGELOG.md).

## License

Copyright (C) 2021-2023 Jan Schaffranek.  
Licensed under the [MIT License](LICENSE).

## Supporting the Work

Feel free to donate, such that I have more time to work on my VSCode extension*s*.

![PayPal QR Code](./media/QR-Code.png)

Or use the Link: <https://www.paypal.com/donate/?hosted_button_id=3WDK6ET99ZQCU>
