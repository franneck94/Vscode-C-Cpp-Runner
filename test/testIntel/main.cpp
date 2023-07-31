// Include Intel® Streaming SIMD Extension (Intel® SSE) Class Definitions
#include <fvec.h>

// Shuffle any two single precision floating point from a
// into low two SP FP and shuffle any two SP FP from b
// into high two SP FP of destination

#define SHUFFLE(a, b, i) (F32vec4) _mm_shuffle_ps(a, b, i)
#include <stdio.h>
#define SIZE 20

// Global variables
float result;
F32vec4 array[SIZE];

//*****************************************************
// Function: Add20ArrayElements
// Add all the elements of a twenty element array
//*****************************************************
void Add20ArrayElements(F32vec4 *array, float *result)
{
    F32vec4 vec0, vec1;
    vec0 = _mm_load_ps((float *)array); // Load array's first four floats

    //*****************************************************
    // Add all elements of the array, four elements at a time
    //******************************************************
    vec0 += array[1]; // Add elements 5-8
    vec0 += array[2]; // Add elements 9-12
    vec0 += array[3]; // Add elements 13-16
    vec0 += array[4]; // Add elements 17-20

    //*****************************************************
    // There are now four partial sums.
    // Add the two lowers to the two raises,
    // then add those two results together
    //*****************************************************
    vec1 = SHUFFLE(vec1, vec0, 0x40);
    vec0 += vec1;
    vec1 = SHUFFLE(vec1, vec0, 0x30);
    vec0 += vec1;
    vec0 = SHUFFLE(vec0, vec0, 2);
    _mm_store_ss(result, vec0); // Store the final sum
}

int main(int argc, char *argv[])
{
    int i;

    // Initialize the array
    for (i = 0; i < SIZE; i++)
    {
        array[i] = (float)i;
    }

    // Call function to add all array elements
    Add20ArrayElements(array, &result);

    // Print average array element value
    printf("Average of all array values = %f\n", result / 20.);
    printf("The correct answer is %f\n\n\n", 9.5);

    return 0;
}
