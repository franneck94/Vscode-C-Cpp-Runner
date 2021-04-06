# VSCode C/C++ Runner

Compile and run your C/C++ code with an ease.

This extension provides tasks to compile and run your C/C++ code.
There are tasks for debug and release builds and also for debugging and executing your code.

## Software Requirements

- Microsoft's C/C++ VSCode Extension (highly recommended)
- For C code: gcc/clang, gdb/lldb and make
- For C++ code: g++/clang++, gdb/lldb and make
- Allowed file extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- Allowed file extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx

## Install the Software Requirements (optional)

- For Windows users it is recommended to install gcc, g++, gdb and make via Cygwin: <https://www.cygwin.com/>
- For Linux users it is recommended to install gcc, g++, gdb and make via a package manager (e.g. *apt* for Debian derivates)
- For MacOS users it is recommended to install clang, clang++, lldb and make via xcode-tools: <https://developer.apple.com/xcode/features/>

## How to use

At first you have to select a working directory where your C/C++ code is that you want to compile and run.
In addition you can select to build the binary in debug or relase mode.
If the compiler's architecture is either 32 or 64bit is evaluated by the extension.
Afterwards, you can press the shortcut *ctrl+shift+r* then you will get a quick pick menu to choose an appropiate task.

For example if you select a working directory with the name *vscode-test/folder1* and *debug-x64* mode, you will get the following tasks:

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- Build: This task will compile all C/C++ files in the selected folder and will link them into a binary.
- Run*: This task will execute the binary.
- Clean*: This task will delete all obj files (*.o).
- Debug*: This task will start a debugging session for the binary.

*The task is only present if there is a build folder for the selected debug/release mode.

## Example

The working directory *vscode-test/folder1* and *debug-x64* mode is selected at first.
Then, the build task is executed. This task will create a build directory where the object files and the executable is created.
After generating the executable the *run* task will execute the program.
If you want to keep the build folder clean you can run the *clean* task, to remove all object files.
If you want to debug the binary you can run the *debug* task.
For every task in the tasks list of the *ctrl+shift+r*, there is also an icon in the blue status bar.

![ExampleGif](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/ExecuteTasks.gif?raw=true)

## Extension Options

- C Compiler path (default's to gcc)
- C Standard (default's to c89)
- C++ Compiler path (default's to g++)
- C++ Standard (default's to c++11)
- Make path (default's to make)
- Debugger path (default's to gdb)
- To enable warnings (default's to true)
- What warnings should be checked by the compiler (default's to '-Wall -Wextra -Wpedantic')
- To treat warnings as errors (default's to false)
- Additional compiler arguments (default's to None)
- Additional linker arguments (default's to None)
- Additional include paths (default's to None)
