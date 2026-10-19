#!/bin/bash

num=$(gsettings get org.gnome.desktop.wm.preferences num-workspaces)

((num--))

if [ $num -lt 1 ]; then
	num=1
fi

gsettings set org.gnome.desktop.wm.preferences num-workspaces $num
