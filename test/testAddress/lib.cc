#include <iostream>
#include <cstdint>

#include "lib.h"

void f()
{
    const auto length = std::size_t{4};
    std::int32_t *arr = nullptr;

    for (std::size_t i = 0; i < length; i++)
    {
        arr[i] = static_cast<std::int32_t>(i);
        std::cout << arr[i] << '\n';
    }

    delete[] arr;
}
