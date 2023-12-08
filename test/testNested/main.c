#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode 1\n");
#else
    printf("Release Mode 1\n");
#endif

    return 0;
}
