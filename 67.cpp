#include <iostream>
#include <thread>
#include <chrono>
#include <cstdlib>

struct Boneco
{
    bool up = false;
    int delay = 1;

    void clear()
    {
        std::system("clear");
    }

    void move()
    {
        if (this->up) this->go_down();
        else this->go_up();
    }

    void go_down()
    {
        this->up = false;
        this->clear();

        std::cout << "    000\n";
        std::cout << "6   000 \n";
        std::cout << "_   /|\\   7\n";
        std::cout << "  \\/ | \\  _\n";
        std::cout << "     |  \\/\n";
        std::cout << "     |  \n";
        std::cout << "    / \\ \n";
        std::cout << "   /   \\\n";
    }

    void go_up()
    {
        this->up = true;
        this->clear();

        std::cout << "    000\n";
        std::cout << "    000   7\n";
        std::cout << "6   /|\\   _\n";
        std::cout << "_  / | \\/\n";
        std::cout << " \\/  |   \n";
        std::cout << "     |  \n";
        std::cout << "    / \\ \n";
        std::cout << "   /   \\\n";
    }

};


int main(void)
{
    Boneco lindoval;
    while (true)
    {
        lindoval.move();
        std::this_thread::sleep_for(std::chrono::seconds(lindoval.delay));
    }
}