#include "cuda_runtime.h"
#include "device_launch_parameters.h"

#include <iostream>
#include <stdlib.h>

#define N 10000000

__global__ void vector_add(float *out, float *a, float *b, int n)
{
    for (int i = 0; i < n; i++)
    {
        out[i] = a[i] + b[i];
    }
}

int main()
{
    float *a = NULL;
    float *b = NULL;
    float *d_a = NULL;
    float *d_b = NULL;
    float *out = NULL;

    a = (float *)malloc(sizeof(float) * N);
    b = (float *)malloc(sizeof(float) * N);

    // Allocate device memory for a
    cudaMalloc((void **)&d_a, sizeof(float) * N);
    cudaMalloc((void **)&d_b, sizeof(float) * N);

    // Transfer data from host to device memory
    cudaMemcpy(d_a, a, sizeof(float) * N, cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, b, sizeof(float) * N, cudaMemcpyHostToDevice);

    vector_add<<<1, 1>>>(out, d_a, d_b, N);

    // Cleanup after kernel execution
    cudaFree(d_a);
    cudaFree(d_b);
    free(a);
    free(b);

    std::cout << "Test\n";

    return 0;
}
