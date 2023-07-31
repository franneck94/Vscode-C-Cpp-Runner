#include <fvec.h>

#define SHUFFLE(a, b, i) (F32vec4) _mm_shuffle_ps(a, b, i)
#include <stdio.h>
#define SIZE 20

int main(int argc, char *argv[])
{
    F32vec4 array[SIZE];
    int i;

    for (i = 0; i < SIZE; i++)
    {
        array[i] = (float)i;
    }

    return 0;
}
