# VSCode C/C++ Runner

Compile and run your C/C++ code with an ease.

This extension provides tasks to compile and run your C/C++ code with gcc or clang.  
There are tasks for debug (-g3 -O0) and release (-O3 -DNDEBUG) builds.

## Software Dependencies

- For C code: gcc or clang and make
- For C++ code: g++ or clang++ and make
- Allowed file extensions for headers: \*.h, \*.hpp, \*.hh, \*.hxx
- Allowed file extensions for sources: \*.c, \*.cpp, \*.cc, \*.cxx

## How to use

At first you have to select a working directory where your C/C++ code is that you want to compile and run.  
In addition you can select to build the binary in debug or relase mode and, if your compiler is able to, you can choose between a in 32bit or 64bit build.  
Afterwards, you can press the shortcut *ctrl+shift+r* then you will get a quick pick menu to choose an appropiate task for compiling, running or cleaning the build in your selected folder.

For example if you select a working directory with the name *vscode-test/folder1* and *debug-x64* mode, you will get the following tasks:

![TaskQuickBar](https://github.com/franneck94/Vscode-C-Cpp-Runner/blob/master/media/TaskQuickPick.png?raw=true)

- Build: This task will compile all C/C++ files in the selected folder and will link them into a binary.
- Run: This task will execute the binary.
- Clean: This task will delete all obj files (*.o) for the build.

## Example

The working directory *vscode-test/folder1* and *debug-x64* mode is selected at first.  
Then, the build task is executed. This task will create a build directory where the object files and the executable is created.  
After generating the executable the *run* task will execute the program.  
If you want to keep the build folder clean you can run the *clean* task, to remove all object files.

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
