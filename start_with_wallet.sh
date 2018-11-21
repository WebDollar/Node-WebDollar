if [ "$WALLET" = "" ]
then
  (sleep 60;echo 8;) | npm run commands || true
else
  echo $WALLET > wallet.json
  (sleep 20;echo 3; sleep 5; echo 0; sleep 5; echo 'y';sleep 5;echo 4;sleep 5;echo 'wallet.json';sleep 5; expect -c "send \003;") | npm run commands || true
  (sleep 20;echo 8;) | npm run commands || true
fi
