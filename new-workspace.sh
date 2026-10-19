#!/bin/bash

current=$(gsettings get org.gnome.desktop.wm.preferences num-workspaces)

gsettings set org.gnome.desktop.wm.preferences num-workspaces $((current + 1))
