###############
## VARIABLES ##
###############
LANGUAGE_MODE ?= Cpp
COMPILATION_MODE ?= Debug
ENABLE_WARNINGS ?= 1
WARNINGS_AS_ERRORS ?= 0
WARNINGS ?= -Wall -Wextra -Wpedantic
C_COMPILER ?= gcc
C_STANDARD ?= c99
CPP_COMPILER ?= g++
CPP_STANDARD ?= c++11
EXECUTABLE_NAME ?= main
ARCHITECTURE ?= ""
COMPILER_ARGS ?= ""
LINKER_ARGS ?= ""
INCLUDE_PATHS ?= ""
DEBUG_FLAGS ?= -g3 -O0
RELEASE_FLAGS ?= -O3 -DNDEBUG
CPP_COMPILER_FLAGS = ""
C_COMPILER_FLAGS = ""

#######################
## OS DEPENDENT VARS ##
#######################
RM_CHECK = $(shell rm -f 2>/dev/null || echo Unknown)

ifneq ($(RM_CHECK), "Unknown") # Unix like terminal
BUILD_DIR ?= build/$(COMPILATION_MODE)
MKDIR_PATH = $(BUILD_DIR)
MKDIR_FUNC = mkdir -p
RM_FUNC = rm -f
CLEAN_PATH = $(BUILD_DIR)/*.o
else # Plain windows terminal
BUILD_DIR ?= build\$(COMPILATION_MODE)
MKDIR_PATH = $(subst /,\\,$(BUILD_DIR))
MKDIR_FUNC = mkdir
RM_FUNC = del /s /q
CLEAN_PATH = $(subst /,\\,$(BUILD_DIR)\\*.o)
endif

########################
## COMPILER ARGUMENTS ##
########################
ifeq ($(COMPILATION_MODE), Release)
C_COMPILER_FLAGS := $(RELEASE_FLAGS)
CPP_COMPILER_FLAGS := $(RELEASE_FLAGS)
else
C_COMPILER_FLAGS := $(DEBUG_FLAGS)
CPP_COMPILER_FLAGS := $(DEBUG_FLAGS)
endif

ifeq ($(C_STANDARD),)
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) -std=$(C_STANDARD)
endif
ifeq ($(CPP_STANDARD),)
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
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) -I $(INCLUDE_PATHS)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) -I $(INCLUDE_PATHS)
endif

ifneq ($(LINKER_ARGS), "")
C_COMPILER_FLAGS := $(C_COMPILER_FLAGS) $(LINKER_ARGS)
CPP_COMPILER_FLAGS := $(CPP_COMPILER_FLAGS) $(LINKER_ARGS)
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

CPP_SRCS := $(wildcard *.cpp)
CPP_OBJECTS := $(patsubst %.cpp, $(BUILD_DIR)/%.o, $(CPP_SRCS))

CXX_SRCS := $(wildcard *.cxx)
CXX_OBJECTS := $(patsubst %.cxx, $(BUILD_DIR)/%.o, $(CXX_SRCS))

CC_SRCS := $(wildcard *.cc)
CC_OBJECTS := $(patsubst %.cc, $(BUILD_DIR)/%.o, $(CC_SRCS))

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
## HELPER TARGETS ##
####################
$(BUILD_DIR):
	$(MKDIR_FUNC) $(MKDIR_PATH)

####################
## PSEUDO TARGETS ##
####################
build: $(BUILD_DIR) | $(BUILD_DIR)/$(EXECUTABLE_NAME)

#############
## TARGETS ##
#############

$(BUILD_DIR)/$(EXECUTABLE_NAME): $(OBJECTS)
	$(COMPILER_CALL) $^ -o $@

execute:
	./$(BUILD_DIR)/$(EXECUTABLE_NAME)

clean:
	$(RM_FUNC) $(CLEAN_PATH)

##############
## PATTERNS ##
##############
$(BUILD_DIR)/%.o : %.c
	$(C_COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cpp
	$(CPP_COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cc
	$(CPP_COMPILER_CALL) -c $< -o $@

$(BUILD_DIR)/%.o : %.cxx
	$(CPP_COMPILER_CALL) -c $< -o $@

###########
## PHONY ##
###########
.PHONY: clean build execute
