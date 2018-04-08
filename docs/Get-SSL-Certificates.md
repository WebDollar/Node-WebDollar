# SSL Certificates

1. Open https://www.sslforfree.com/

2. Include your new no-ip domain
3. Click the **Manual Verification**
4. Click **Manual Verify Domain**
5. **Download Files**
6. Copy the downloaded files to the folder /certificates/well-known/acme-challenge
7. Click on the website "Retry Manual Verification"
8. Download the Certificates and copy the certificates into the /certificates directory
9. Restart the terminal and run again `run start`
10. Delete the .well-know/acme-challenge files (optionally)