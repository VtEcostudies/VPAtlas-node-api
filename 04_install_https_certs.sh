# set server hostname:
sudo nano /etc/hostname
# values are 
# - production: vpatlas.org
# - staging: dev.vpatlas.org
sudo hostname dev.vpatlas.org
# check hostname
hostname
# configure domain name to point to server:
https://domains.google.com/registrar/vpatlas.org/dns
# - Manage custom records
# - Add dev subdomain A record to vpatlas domain with Elastic IP address assigned to AWS instance
# install https certs to be used by both the API and the UI
sudo apt install certbot
