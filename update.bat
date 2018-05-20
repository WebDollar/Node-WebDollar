::Script for getting the last master revision on windows systems
call git reset --hard origin/master
call git pull origin master
call npm install
