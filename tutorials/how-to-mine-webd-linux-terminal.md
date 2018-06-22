# How-to-mine-WebDollar-with-Linux-Terminal
Mine WebDollar with Linux Terminal

#### 1. Run ```git clone https://github.com/cbusuioceanu/Node-WebDollar.git Node-WebDollar1```
#### 2. Install:
####  a. ```apt install npm``` -> Note: if ```apt``` doesn't work, replace it with ```apt-get```.
####  b. ```cd Node-WebDollar1```
####  c. ```npm install```
####  d. ```npm run commands```
####  e. ```press 8 then Enter```
####  f. ```Mining starts after Blockchain is Downloaded```
----
### **Create a password for your WebDollar Wallet**
#### -> After you run ```npm run commands```, press ```6``` then press ```0``` (0 is your first address in your Wallet). Copy/paste a 12 word passphrase and press enter
#### -> Warning: make sure you backup your passphrase very well. If you loose it, your wallet is gone forever!
----
### **Save your Wallet to your storage**
#### -> Press ```5``` then press ```0``` (0 is your first address in your Wallet) then enter a location where it should be saved. 
   Example: ```/home/webd1/Node-WebDollar1/```
#### -> If you see the message, "Address Exported Successfully!" your address was saved.
----
### **How to update Miner instance**
#### -> Stop mining with ```ctrl + c``` (better stop it after you see the message *Saving Blockchain Starting from x y*) then run ```update.sh```
#### -> Start mining again with ```npm run commands``` and ```8```
----
### Blockchain Loading and Saving example ###
<img src="https://webdollarvpn.io/img/webdollar-saving-blockchain-img1.jpg" alt="Blockchain Loading Example" /></img>
----
### WebDollar Mining Example
<img src="https://webdollarvpn.io/img/webdollar-mining-terminal-img1.jpg" alt="WebDollar Mining Example" /></img>
