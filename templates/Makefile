###############
## VARIABLES ##
###############
# Pre-defined values
DEBUG_FLAGS = -g3 -O0
RELEASE_FLAGS = -O3 -DNDEBUG
C_COMPILER_FLAGS = ""
CPP_COMPILER_FLAGS = ""

# Required arguments with default values
LANGUAGE_MODE ?= Cpp
COMPILATION_MODE ?= Debug
C_COMPILER ?= gcc
CPP_COMPILER ?= g++
EXECUTABLE_NAME ?= out$(COMPILATION_MODE)

# Optional arguments with default values
ENABLE_WARNINGS ?= 0
WARNINGS_AS_ERRORS ?= 0

# Optional arguments without default values
C_STANDARD ?= ""
CPP_STANDARD ?= ""
ARCHITECTURE ?= ""
WARNINGS ?= ""
COMPILER_ARGS ?= ""
LINKER_ARGS ?= ""
INCLUDE_PATHS ?= ""

BUILD_DIR = build/$(COMPILATION_MODE)

# Run/Debug arguments
ARGUMENTS ?= ""

# Internal variable
VERBOSE = 0

ifeq ($(VERBOSE), 1)
$(info C_COMPILER: $(C_COMPILER))
$(info CPP_STANDARD: $(CPP_STANDARD))
$(info LANGUAGE_MODE: $(LANGUAGE_MODE))
$(info EXECUTABLE_NAME MODE: $(EXECUTABLE_NAME))
$(info BUILD_PATH: $(BUILD_DIR))
endif

########################
## COMPILER ARGUMENTS ##
########################
ifeq ($(COMPILATION_MODE), Release)
C_COMPILER_FLAGS = $(RELEASE_FLAGS)
CPP_COMPILER_FLAGS = $(RELEASE_FLAGS)
else
C_COMPILER_FLAGS = $(DEBUG_FLAGS)
CPP_COMPILER_FLAGS = $(DEBUG_FLAGS)
endif

ifneq ($(C_STANDARD), "")
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) -std=$(C_STANDARD)
endif
ifneq ($(CPP_STANDARD), "")
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) -std=$(CPP_STANDARD)
endif

ifneq ($(ARCHITECTURE), "")
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) -m$(ARCHITECTURE)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) -m$(ARCHITECTURE)
endif

ifneq ($(COMPILER_ARGS), "")
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) $(COMPILER_ARGS)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) $(COMPILER_ARGS)
endif

ifneq ($(INCLUDE_PATHS), "")
INCLUDE_PATHS_APP = $(foreach d, $(INCLUDE_PATHS), -I$d)
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) $(INCLUDE_PATHS_APP)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) $(INCLUDE_PATHS_APP)
endif

ifeq ($(ENABLE_WARNINGS), 1)
ifneq ($(WARNINGS), "")
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) $(WARNINGS)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) $(WARNINGS)
endif

ifeq ($(WARNINGS_AS_ERRORS), 1)
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) -Werror
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) -Werror
endif
endif

C_COMPILER_CALL := $(C_COMPILER) $(C_COMPILER_FLAGS)
CPP_COMPILER_CALL := $(CPP_COMPILER) $(CPP_COMPILER_FLAGS)

######################
## WILDCAR COMMANDS ##
######################
C_SRCS := $(wildcard *.c)
C_OBJECTS := $(patsubst %.c, $(BUILD_DIR)/%.o, $(C_SRCS))

CC_SRCS := $(wildcard *.cc)
CC_OBJECTS := $(patsubst %.cc, $(BUILD_DIR)/%.o, $(CC_SRCS))

CXX_SRCS := $(wildcard *.cxx)
CXX_OBJECTS := $(patsubst %.cxx, $(BUILD_DIR)/%.o, $(CXX_SRCS))

CPP_SRCS := $(wildcard *.cpp)
CPP_OBJECTS := $(patsubst %.cpp, $(BUILD_DIR)/%.o, $(CPP_SRCS))

####################
## LANGUAGE MODE  ##
####################
ifeq ($(LANGUAGE_MODE), C)
COMPILER_CALL := $(C_COMPILER_CALL)
OBJECTS := $(C_OBJECTS)
else
COMPILER_CALL := $(CPP_COMPILER_CALL)
OBJECTS := $(CPP_OBJECTS) $(CC_OBJECTS) $(CXX_OBJECTS)
endif

####################
## PSEUDO TARGETS ##
####################
build: $(BUILD_DIR)/$(EXECUTABLE_NAME)

#############
## TARGETS ##
#############

ifneq ($(LINKER_ARGS), "")
EXE_GENERATION = $(LINKER_ARGS) -o
else
EXE_GENERATION = -o
endif

$(BUILD_DIR)/$(EXECUTABLE_NAME): $(OBJECTS)
	$(COMPILER_CALL) $^ $(EXE_GENERATION) $@

ifneq ($(ARGUMENTS), "")
EXE_CALL = ./$(BUILD_DIR)/$(EXECUTABLE_NAME) $(ARGUMENTS)
else
EXE_CALL = ./$(BUILD_DIR)/$(EXECUTABLE_NAME)
endif

execute:
	$(EXE_CALL)

##############
## PATTERNS ##
##############
$(BUILD_DIR)/%.o : %.c
	$(COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cpp
	$(COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cc
	$(COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cxx
	$(COMPILER_CALL) -c $< -o $@

###########
## PHONY ##
###########
.PHONY: build execute
