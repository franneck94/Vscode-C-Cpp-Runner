#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode");
#else
    printf("Release Mode");
#endif

    return 0;
}
