#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#include "omp.h"

void *print_message_function(void *ptr)
{
    char *message;
    message = (char *)ptr;
    printf("%s \n", message);

    return (void *)0;
}

void loop()
{
    int array[] = { 1,2, 3, 4 };

    volatile int sum = 0;

    #pragma omp parallel for
    for (unsigned int i = 0; i < 4; ++i)
    {
        sum += array[i];
    }
}

/**
  "C_Cpp_Runner.compilerArgs": [
    "-pthread",
    "-fopenmp"
  ],
 */
int main()
{
    pthread_t thread1, thread2;
    char *message1 = "Thread 1";
    char *message2 = "Thread 2";
    int  iret1, iret2;

    iret1 = pthread_create(&thread1, NULL, print_message_function, (void *)message1);
    iret2 = pthread_create(&thread2, NULL, print_message_function, (void *)message2);

    pthread_join(thread1, NULL);
    pthread_join(thread2, NULL);

    printf("Thread 1 returns: %d\n", iret1);
    printf("Thread 2 returns: %d\n", iret2);

    return 0;
}
