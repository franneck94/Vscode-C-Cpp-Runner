# VSCode C/C++ Runner

Compile and run your C/C++ code with an ease.

This extension provides tasks to compile your C/C++ code with gcc/clang and make.
There are tasks for debug and release builds.
Also, tasks are defined to execute the programs.

## How to use

By pressing the shortcut *ctrl+shift+r* and having at least one C/C++ file open
in your workspace you will get a quick pick menu to choose an appropiate task to
compile/run.

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- Debug (Single File): This task will compile the currently focused C/C++ file with debug symbols (-g) into a binary.
- Release (Single File): This task will compile the currently focused C/C++ file with full optimization (-O3) into a binary.
- Debug (Folder): This task will compile all C/C++ files in the directory of the currently opened folder with debug symbols (-g) and will link all compiled object files into a binary.
- Release (Folder): This task will compile all C/C++ files in the directory of the currently opened folder with full optimization (-O3) and will link all compiled object files into a binary.
- Execute Debug Program: This task will execute the binary that was compiled with debug symbols (-g).
- Execute Release Program: This task will execute the binary that was compiled with full optimization (-O3).
- Clean: This task will delete all obj files (*.o) in the currently opened folder.

## Example

![ExampleGif](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/ExecuteTasks.gif?raw=true)

By executing the task *Debug (Single File)* for the opened C file *main*.c a binary (for windows executable) will be generated with the name *main*Debug.
Note: In any release task the binary would be called *main*Release.
Afterwards, the task *Execute Debug Program* is executed, such that the binary is executed in vscode's terminal.

## Options to set

- C Compiler path (default's to gcc on Windows/Linux, default's to clang in MacOS)
- C Standard (default's to c89/c90)
- C++ Compiler path (default's to g++ on Windows/Linux, default's to clang++ in MacOS)
- C++ Standard (default's to c++11)
- Make path (default's to make)
- To enable warnings (default's to true)
- What warnings should be checked by the compiler (default's to '-Wall -Wextra -Wpedantic')
- To treat warnings as errors (default's to false)
