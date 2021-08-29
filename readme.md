# Telegram bot that downloads torrents

please add a .env file in the root with the following

```
BOT_TOKEN=<Telegram bot token>
DOWNLOAD_DIR=<Download directory - default is where the bot runs from>
TORRENTS_DIR=<Torrent files directory - default is DOWNLOAD_DIR/torrents>
ADMINS_CHATID=<Telegram chat Ids of admins seperated with comma>
```

## Docker compose example

```yaml
version: '3'
services:
    downloader:
        image: ghcr.io/deanshub/downloader
        restart: unless-stopped
        volumes:
            - '/media/pi/MyDrive/raspberry-downloads/:/downloads'
            - '/media/pi/MyDrive/raspberry-torrents/:/torrents'
        environment:
            BOT_TOKEN: 'TOKEN_HERE'
            DOWNLOAD_DIR: '/downloads'
            TORRENTS_DIR: '/torrents'
            ADMINS_CHATID: 'ID1,ID2'
```
