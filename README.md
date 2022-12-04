# VSCode C/C++ Runner

🚀 Compile, run and debug **single** or **multiple** C/C++ files with ease. 🚀  
You do not need to know about any compiler commands. 😎

## Example

![ExampleGif](./media/ExecuteTasks.gif?raw=true)

## Software Requirements

- 🔧 For C code: Any GCC, Clang, or MSVC compiler
- 🔧 For C++ code: Any G++, Clang++ or MSVC compiler

Make sure that your GCC/Clang compiler is either in your PATH or you have to manually set the **C/ C++ Compiler Path** setting of this extension.  
For the MSVC compiler usage see [here](#Using-the-MSVC-Compiler).

## Extension Activation Conditions

- Whenever there is a C/C++ file in the **base** directory of your workspace
- Whenever you open a C/C++ file in your workspace

## How to use: Compile **all** files in a folder

1️⃣ Select the folder that contains the C/C++ files.  
You can select the folder by the quick pick menu from the status bar.  
![TaskStatusBar](./media/FolderStatusBar.png)  
Besides that, you can also select a folder by right-clicking in the context menu or pressing *ctrl+alt+f*.  
2️⃣ Select either debug or release mode for building the binary (debug is the default case).  
The keyboard shortcut is *ctrl+alt+g*.  
![TaskStatusBar](./media/ModeStatusBar.png)  
3️⃣ Now you can build/run/debug the binary.  
The keyboard shortcut for the building is *ctrl+b*, for debugging is *ctrl+alt+d* and for running is *ctrl+alt+r*.  
![TaskStatusBar](./media/TaskStatusBar.png)

- ⚙️ Build: This task will compile all C/C++ files in the selected folder and will link them into a binary.
- ▶️ Run*: This task will execute the built binary.
- 🗑️ Clean*: This helper task will delete all compiled object files (*.o).
- 🐞 Debug*: This task will start a debugging session for the binary.

*This task is a no-op if the build task was not executed previously.

## How to use: Compile a **single** file

1️⃣ Open the C/C++ file you want to compile (build).  
2️⃣ Select either debug or release mode for building the binary (debug is the default case).  
3️⃣ To build the binary press **ctrl+alt+b**.  
4️⃣ To run the binary press **ctrl+alt+r**.  
5️⃣ To debug the binary press **ctrl+alt+d**.  

## Extension Features

### Passing Commandline Arguments

You can pass in command-line arguments for running or debugging the binary.  
Make sure to select the active folder beforehand, then press `ctrl+alt+a` to open the message box to type in the arguments:

![Arguments](./media/arguments.png)

These arguments will be stored in the launch.json config for debugging the binary.  

![ArgumentsDebug](./media/argumentsDebug.png)

If you now run or debug your program these values will be fed into **argc**/**argv**.  
The stored arguments will be reset after selecting a new active folder.  
Note: For strings with whitespaces please use \" (not single \').

### Include & Exclude Folders for Selection

You can add glob patterns to include and exclude folders from the search to shorten the list.  
Note: The include pattern is used before the exclude pattern.

For example with the following exclude glob pattern:

![ExcludePattern](./media/excludePattern.png)

The folder selection would change from left to right.

![ExcludePaths1](./media/excludePaths1.png)
![ExcludePaths2](./media/excludePaths2.png)

For more information about the glob pattern see [here](https://en.wikipedia.org/wiki/Glob_(programming)#Syntax).

### Configuration

The current configuration settings will be stored locally in *".vscode/settings.json"*.  
![FoundCompiler](./media/Settings.png)  

Based on the settings, the local *.vscode/c_cpp_properties.json* file is created and will be used by [Microsoft's *C/C++*](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference) extension for intellisense.  
There, the compiler path, the C/C++ standard, and the included paths are **synced** with these extension settings.  

### Extension Settings

- ⚙️ C Compiler path (defaults to gcc)
- ⚙️ C Standard (defaults to the compiler's default)
- ⚙️ C++ Compiler path (defaults to g++)
- ⚙️ C++ Standard (defaults to the compiler's default)
- ⚙️ Debugger path (defaults to gdb)
- ⚙️ MSVC batch path (defaults to \"\")
- ⚙️ Use MSVC (defaults to false)
- ⚙️ To enable warnings (defaults to True)
- ⚙️ What warnings should be checked by the compiler
- ⚙️ To treat warnings as errors (defaults to False)
- ⚙️ Additional compiler arguments (defaults to [] e.g. **-flto**)
- ⚙️ Additional linker arguments (defaults to [] e.g. **-lpthread**).
  - Note: It **is** expected to prefix the arguments with the appropriate flags (e.g. -l or -L)
- ⚙️ Additional include paths (defaults to [] e.g. **path/to/headers/**)
  - Note: It is **not** (!) expected to prefix the arguments with the **-I** flag
- ⚙️ Include glob pattern for the folder selection (defaults to ["\*", "\*\*/\*"])
- ⚙️ Exclude glob pattern for the folder selection (defaults to ["\*\*/build", "\*\*/.\*", "\*\*/.vscode",])

## Important Notes

### Constraints with Files and Folders

- 📝 Allowed file extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- 📝 Allowed file extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx
- ⚠️ Include paths with whitespaces can make the compilation fail

### CMake Projects in the Workspace Directory

This extension does not start whenever there is a CMakeLists.txt in the workspace root directory.  
This prevents an overloaded status bar with a lot of icons due to Microsoft's CMake extension.  
However, the user can trigger the start-up of this extension by pressing `ctrl+alt+t`.

## Using the MSVC Compiler

To use the MSVC compiler (toolchain), set the **msvcBatchPath** setting to a valid path.  
An example path would be **"C:/Program Files/Microsoft Visual Studio/2022/Community/VC/Auxiliary/Build/vcvarsall.bat"**.  
Then set the **useMsvc** to true, to not use GCC/Clang tools in the current workspace.  
If you want to stop using the MSVC compiler, just set **useMsvc** to false.  
Note: Only the 64bit (no cross-compiling) version of MSVC is allowed

## Release Notes

Refer to the [CHANGELOG](CHANGELOG.md).

## License

Copyright (C) 2021-2022 Jan Schaffranek.  
Licensed under the [MIT License](LICENSE).

## Supporting the Work

Feel free to donate, such that I have more time to work on my VSCode extension*s*.

![PayPal QR Code](./media/QR-Code.png)

Or use the Link: <https://www.paypal.com/donate/?hosted_button_id=3WDK6ET99ZQCU>
