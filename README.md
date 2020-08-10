# zero-api
Docker image to test zero trust networks

## Things you'll need
* tls key and cert
* passphrase
* fingerprint sha256
* a network to test on


## How to run

```cli
docker run \
    -v path/to/certs:certs/ \
    -p 3000:3000
    -e PRIVATE_KEY_PASSPHRASE="somecoolphrase" \
    -e \
    FINGERPRINT256="DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09" \
    danielc103/zero-api:latest
```

## Developer Options

Clone repo - modify server as desired and build docker


**Please feel free to use or modify**


[![forthebadge](https://forthebadge.com/images/badges/uses-badges.svg)](https://forthebadge.com)

[![forthebadge](https://forthebadge.com/images/badges/made-with-crayons.svg)](https://forthebadge.com)