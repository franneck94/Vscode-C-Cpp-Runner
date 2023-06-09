#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode 1\n");
#else
    printf("Release Mode 1\n");
#endif

#ifdef _DEBUG
    printf("Debug Mode 2\n");
#else
    printf("Release Mode 2\n");
#endif

    return 0;
}
