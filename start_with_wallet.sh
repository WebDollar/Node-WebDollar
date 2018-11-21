if [ "$WALLET" = "" ]
then
  (sleep 60;echo 8;) | npm run commands || true
else
  echo $WALLET > wallet.json
  (sleep 60;echo 4;sleep 5;echo 'wallet.json';sleep 5;echo 7;sleep 5;echo 1;sleep 5;echo 8;) | npm run commands || true
fi
