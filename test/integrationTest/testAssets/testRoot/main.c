#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode");
#else
    printf("Release Mode");
#endif

    int i = 2;
    int j = i * 3;

    return 0;
}
