# VSCode C/C++ Runner

🚀 Compile and run your C/C++ code with an ease. 🚀

This extension provides tasks to compile, run and debug your C/C++ code.  
You do not need to know about any compiler commands, and the extension works on Windows, Linux and MacOS 😎.

## Software Requirements

- 🔧 Microsoft's C/C++ VSCode Extension (will be installed automatically)
- 🔧 For C: gcc/clang, gdb/lldb and make
- 🔧 For C++: g++/clang++, gdb/lldb and make

## Install the Software Requirements (optional)

- 🖥️ Windows: Recommended to install gcc/g++, gdb and make via Cygwin: <https://www.cygwin.com/>
- 🖥️ Linux: Recommended to install gcc/g++, gdb and make via a package manager (e.g. *apt* for Debian derivates)
- 🖥️ MacOS: Recommended to install clang/clang++, lldb and make via xcode-tools: <https://developer.apple.com/xcode/features/>

## How to use

The first step is to select the folder that contains the C/C++ files you want to compile, run or debug.  
In addition you can select to build the binary in debug or relase mode.  
Afterwards, you can press the shortcut *ctrl+shift+r* to get a quick pick menu for the tasks.  
For every quick pick menu entry, there is also an icon in the bottom blue status bar.

For example if you select a working directory with the name *vscode-test/folder1* and *debug-x64* mode, you will get the following tasks:

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- 🛠 Build: This task will compile all C/C++ files in the selected folder and will link them into a binary.
- ▶️ Run*: This task will execute the binary.
- 🗑️ Clean*: This task will delete all obj files (*.o).
- 🐞 Debug*: This task will start a debugging session for the binary.

*The task is only present if there is a build folder for the selected debug/release mode.

## Example

![ExampleGif](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/ExecuteTasks.gif?raw=true)

## Extension Options

- ⚙️ C Compiler path (default's to gcc)
- ⚙️ C Standard (default's to c89)
- ⚙️ C++ Compiler path (default's to g++)
- ⚙️ C++ Standard (default's to c++11)
- ⚙️ Make path (default's to make)
- ⚙️ Debugger path (default's to gdb)
- ⚙️ To enable warnings (default's to true)
- ⚙️ What warnings should be checked by the compiler (default's to '-Wall -Wextra -Wpedantic')
- ⚙️ To treat warnings as errors (default's to false)
- ⚙️ Additional compiler arguments (default's to None)
- ⚙️ Additional linker arguments (default's to None)
- ⚙️ Additional include paths (default's to None)

## Important Notes

##### Allowed File Extensions

- 📂 Allowed file extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- 📁 Allowed file extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx

##### CMake Projects

The extension does not activate on start whenever there is a CMakeLists.txt file in the root directory of the workspace.
Otherwise the status bar would have a lot of buttons from this extension and from *Microsoft's CMake Tools* extension.
However the user can trigger the start-up of this extension by pressing *ctrl+shift+r* regardless of a present CMake file.
