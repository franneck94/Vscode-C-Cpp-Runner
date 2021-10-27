#include <stdio.h>

int main()
{
#ifndef NDEBUG
    printf("Debug Mode");
#else
    printf("Release Mode");
#endif

    int i = 2;
    printf("TEST Mode\n");
    printf("%d\n", i);

    return 0;
}
