#include <stdio.h>
#include <stdlib.h>

#include "omp.h"

void loop()
{
    long long m;

#pragma omp parallel for
    for (m = 0; m < 16; m++)
    {
        printf("thread = %d, m = %lld\n", omp_get_thread_num(), m);
    }
}

int main()
{
    loop();

    return 0;
}
