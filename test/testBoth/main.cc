#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode - Nested 1");
#else
    printf("Release Mode - Nested 1");
#endif

    return 0;
}
