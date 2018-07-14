#!/bin/bash

# Tested on CentOS 7

yum update
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
sudo yum -y install nodejs
sudo yum groupinstall "Development Tools"
sudo yum -y install clang
npm install -g node-gyp
npm install
