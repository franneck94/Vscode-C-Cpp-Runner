# VSCode C/C++ Runner

Compile and run your C/C++ code with an ease.

This extension provides tasks to compile and run your C/C++ code with gcc or clang.  
There are tasks for debug (-g -O0) and release (-O3 -DNDEBUG) builds.

## Software Dependencies

- For C code: gcc or clang and make
- For C++ code: g++ or clang++ and make
- Allowed file extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- Allowed file extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx

## How to use

By pressing the shortcut *ctrl+shift+r* and having at least one C/C++ file in your workspace you will get a quick pick menu to choose an appropiate task for
compiling or running.

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- Build Debug (Single File): This task will compile the currently opened C/C++ file with debug symbols into a binary.
- Build Release (Single File): This task will compile the currently opened C/C++ file with full optimization  into a binary.
- Build Debug (Folder): This task will compile all C/C++ files in the directory of the currently opened C/C++ file with debug symbols and will link them into a binary.
- Build Release (Folder): This task will compile all C/C++ files in the directory of the currently opened C/C++ file with full optimization  and will link them into a binary.
- Execute Debug Program: This task will execute the debug binary.
- Execute Release Program: This task will execute the release binary.
- Clean Debug Objects: This task will delete all obj files (*.o) for the debug build.
- Clean Release Objects: This task will delete all obj files (*.o) for the release build.

## Example

By executing the task *Buid: Debug (Single File)* for the opened C file *main*.c, a binary will be generated.  
This binary will be called *main*Debug and will be stored in the *./build/debug/* path, relative to the *main*.c file.  
Afterwards, the task *Execute: Debug Program* is executed, such that the binary is run in vscode's terminal.

![ExampleGif](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/ExecuteTasks.gif?raw=true)

## Extension Options

- C Compiler path (default's to gcc/clang depending on the system)
- C Standard (default's to c89/c90)
- C++ Compiler path (default's to g++/clang++ depending on the system)
- C++ Standard (default's to c++11)
- Make path (default's to make)
- To enable warnings (default's to true)
- What warnings should be checked by the compiler (default's to '-Wall -Wextra -Wpedantic')
- To treat warnings as errors (default's to false)
- Additional compiler arguments (default's to None)
- Additional linker arguments (default's to None)
- Additional include paths (default's to None)
