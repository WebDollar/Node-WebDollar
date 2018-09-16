#Script for getting the last master revision on linux systems
git reset --hard origin/master
git pull origin master
npm install
