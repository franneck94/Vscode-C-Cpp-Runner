###############
## VARIABLES ##
###############
LANGUAGE_MODE ?= C
COMPILATION_MODE ?= Debug
ENABLE_WARNINGS ?= 1
WARNINGS_AS_ERRORS ?= 0
WARNINGS ?= -Wall -Wextra -Wpedantic
C_COMPILER ?= gcc # gcc, clang
C_STANDARD ?= c99 # c90, c99, c11, c17
CPP_COMPILER ?= g++ # g++, clang++
CPP_STANDARD ?= c++2a # c++11, c++14, c++17, c++2a
EXECUTABLE_NAME ?= main

ifeq ($(COMPILATION_MODE), Debug)
C_COMPILER_FLAGS = -g -std=$(C_STANDARD)
CPP_COMPILER_FLAGS = -g -std=$(CPP_STANDARD)
else ifeq ($(COMPILATION_MODE), Release)
C_COMPILER_FLAGS = -O3 -std=$(C_STANDARD)
CPP_COMPILER_FLAGS = -O3 -std=$(CPP_STANDARD)
endif

ifeq ($(ENABLE_WARNINGS), 1)
C_COMPILER_FLAGS += $(WARNINGS)
CPP_COMPILER_FLAGS += $(WARNINGS)
endif

ifeq ($(WARNINGS_AS_ERRORS), 1)
C_COMPILER_FLAGS += -Werror
CPP_COMPILER_FLAGS += -Werror
endif

C_COMPILER_CALL = $(C_COMPILER) $(C_COMPILER_FLAGS)

C_SRCS = $(wildcard *.c)
C_OBJECTS = $(filter %.o, $(patsubst %.c,  %.o, $(C_SRCS)))

CPP_COMPILER_CALL = $(CPP_COMPILER) $(CPP_COMPILER_FLAGS)

CPP_SRCS = $(wildcard *.cpp)
CPP_OBJECTS = $(patsubst %.cpp, %.o, $(CPP_SRCS))

CC_SRCS = $(wildcard *.cc)
CC_OBJECTS = $(patsubst %.cc, %.o, $(CC_SRCS))

####################
## LANGUAGE MODE  ##
####################
ifeq ($(LANGUAGE_MODE), C)
COMPILER_CALL = $(C_COMPILER_CALL)
OBJECTS = $(C_OBJECTS)
endif
ifeq ($(LANGUAGE_MODE), Cpp)
COMPILER_CALL = $(CPP_COMPILER_CALL)
OBJECTS = $(CPP_OBJECTS) $(CC_OBJECTS)
endif

####################
## PSEUDO TARGETS ##
####################
build: $(EXECUTABLE_NAME)

#############
## TARGETS ##
#############
build_single:
	$(COMPILER_CALL) -o $(EXECUTABLE_NAME) $(FILE_NAME)

$(EXECUTABLE_NAME): $(OBJECTS)
	$(COMPILER_CALL) $^ -o $@

execute:
	./$(EXECUTABLE_NAME)

clean:
	$(RM) *.o

##############
## PATTERNS ##
##############
%.o : %.c
	$(C_COMPILER_CALL) -c $< -o $@

%.o : %.cpp
	$(CPP_COMPILER_CALL) -c $< -o $@

%.o : %.cc
	$(CPP_COMPILER_CALL) -c $< -o $@
