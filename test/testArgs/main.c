#include <stdio.h>
#include <string.h>

int main(int argc, char **argv)
{
    printf("argc: %d\n", argc);
    for (int i = 0; i < argc; i++)
    {
        printf("argv[%d]: %s\n", i, argv[i]);
    }

    int i = 0;
    scanf("%d", &i);
    printf("%d\n", i);

    return 0;
}