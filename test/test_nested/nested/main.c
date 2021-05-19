#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("1 Debug Mode");
#else
    printf("1 Release Mode");
#endif

    return 0;
}
