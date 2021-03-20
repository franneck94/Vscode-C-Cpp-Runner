###############
## VARIABLES ##
###############
COMPILATION_MODE ?= Debug
ENABLE_WARNINGS ?= 1
WARNINGS_AS_ERRORS ?= 0
C_COMPILER ?= gcc # gcc, clang
C_STANDARD ?= c99 # c90, c99, c11, c17
EXECUTABLE_NAME ?= main

ifeq ($(COMPILATION_MODE), Debug)
C_COMPILER_FLAGS = -g -std=$(C_STANDARD)
else ifeq ($(COMPILATION_MODE), Release)
C_COMPILER_FLAGS = -O3 -std=$(C_STANDARD)
endif

ifeq ($(ENABLE_WARNINGS), 1)
C_COMPILER_FLAGS += -Wall -Wextra -Wpedantic
endif

ifeq ($(WARNINGS_AS_ERRORS), 1)
C_COMPILER_FLAGS += -Werror
endif

C_COMPILER_CALL = $(C_COMPILER) $(C_COMPILER_FLAGS)

CPP_SRCS = $(wildcard *.c)
CPP_OBJECTS = $(filter %.o, $(patsubst %.c,  %.o, $(CPP_SRCS)))

####################
## PSEUDO TARGETS ##
####################
build: $(EXECUTABLE_NAME)

#############
## TARGETS ##
#############
build_single:
	$(C_COMPILER_CALL) -o $(EXECUTABLE_NAME) $(FILE_NAME)

$(EXECUTABLE_NAME): $(CPP_OBJECTS)
	$(C_COMPILER_CALL) $^ -o $@

execute:
	./$(EXECUTABLE_NAME)

clean:
	$(RM) *.o

##############
## PATTERNS ##
##############
%.o : %.c
	$(C_COMPILER_CALL) -c $< -o $@
