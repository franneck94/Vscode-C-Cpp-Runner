# VSCode C/C++ Runner

Compile and run your C/C++ code with an ease.

This extension provides tasks to compile your C/C++ code with gcc or clang.  
There are tasks for debug and release builds and to execute the programs.

## Software Dependencies

- For C code: gcc or clang and make
- For C++ code: g++ or clang++ and make

## How to use

By pressing the shortcut *ctrl+shift+r* and having a C/C++ file opened
in your workspace you will get a quick pick menu to choose an appropiate task for
compiling or running.

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- Debug (Single File): This task will compile the currently opened C/C++ file with debug symbols (-g) into a binary.
- Release (Single File): This task will compile the currently opened C/C++ file with full optimization (-O3) into a binary.
- Debug (Folder): This task will compile all C/C++ files in the directory of the currently opened C/C++ file with debug symbols (-g) and will link them into a binary.
- Release (Folder): This task will compile all C/C++ files in the directory of the currently opened C/C++ file with full optimization (-O3) and will link them into a binary.
- Execute Debug Program: This task will execute the binary that was compiled with debug symbols (-g).
- Execute Release Program: This task will execute the binary that was compiled with full optimization (-O3).
- Clean: This task will delete all obj files (*.o) in the currently opened folder.

## Example

By executing the task *Debug (Single File)* for the opened C file *main*.c, a binary will be generated with the name *main*Debug.  
Afterwards, the task *Execute Debug Program* is executed, such that the binary is run in vscode's terminal.

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
