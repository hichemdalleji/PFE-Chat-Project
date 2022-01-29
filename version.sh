#!/bin/sh
echo node -p -e "require('./package.json').version" > ver.txt
cat ver.txt