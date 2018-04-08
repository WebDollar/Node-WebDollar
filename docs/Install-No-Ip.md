#No-Ip - Domain

Create a free account to https://www.noip.com

#### Unix

Follow the noip.com Tutorial http://www.noip.com/support/knowledgebase/installing-the-linux-dynamic-update-client-on-ubuntu/

###### Unix To Make it Open on startup 

```
sudo update-rc.d noip2 defaults
@reboot /usr/local/bin/noip2
```

In case it fails try this Tutorial how to make NO-IP as start-up service in Linux
https://askubuntu.com/questions/903411/how-do-i-set-up-no-ip-as-a-proper-service

#### Windows

Install No-IP app (5 mb) via https://www.noip.com/download

Follow the Setup using your account and set it up to automatically update your ip

![No Ip Windows](http://dc9wlm4wphap8.cloudfront.net/support/wp-content/uploads/2013/04/windows-duc-4-step5.png)

### Windows, Unix, Mac
1. `npm run start`
2. open http://127.0.0.1
3. Be sure the IP is propagated
4. open http://yourdomain.ddns.net or whatever no-ip domain you have and should receive the same message. In case it will fail to return, it means that your no-ip domain is not configured properly. Are you sure you installed the no-ip software and configured with your account?

You should get **a response** {protocol: WebDollar, version: x.x}. 