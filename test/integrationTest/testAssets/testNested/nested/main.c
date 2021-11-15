#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode 2");
#else
    printf("Release Mode 2");
#endif

    return 0;
}
