#!/usr/bin/env bash
sudo apt-get install clang
npm install -g node-gyp
env CXX=g++-5 npm install
env CXX=g++-5 npm install argon2