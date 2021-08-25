#include <string>

#define _GLIBCXX_USE_CXX11_ABI 0

void test(const std::string &s)
{
    s[0];

    return;
}

int main()
{
    std::string s("Jan");

    test(s);

    return 0;
}
