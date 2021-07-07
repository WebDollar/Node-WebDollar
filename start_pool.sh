if [ "$NEWPOOL" = "false" ]
then
  echo $WALLET > wallet.json
  (sleep 60;echo 4;sleep 5;echo 'wallet.json';sleep 5;echo 7;sleep 5;echo 1;sleep 5;echo 3;sleep 5;echo 0;sleep 5;echo 'y';sleep 5;echo exit;) | npm run commands || true 
  rm -rf ./wallet.json
  (sleep 60;echo 11;sleep 5;echo 'y';sleep 5) | npm run commands || true 
else
  echo $WALLET > wallet.json
  (sleep 60;echo 4;sleep 5;echo 'wallet.json';sleep 5;echo 7;sleep 5;echo 1;sleep 5;echo 3;sleep 5;echo 0;sleep 5;echo 'y';sleep 5;echo exit;) | npm run commands || true 
  rm -rf ./wallet.json
  (sleep 60;echo 11;sleep 5;echo $FEE;sleep 5;echo $POOLNAME;sleep 5;echo $POOLURL;sleep 5;echo $REFERAL;sleep 5;echo 'n';sleep 5) | npm run commands || true 
fi
