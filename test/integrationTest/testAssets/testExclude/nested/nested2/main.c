#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode - Nested 2");
#else
    printf("Release Mode - Nested 2");
#endif

    return 0;
}
