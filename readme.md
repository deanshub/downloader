# Telegram bot that downloads torrents

make sure you have minidlna installed (or some other kind of dlna to stream DOWNLOAD_DIR)

please add a .env file in the root with the following

```
BOT_TOKEN=<Telegram bot token>
DOWNLOAD_DIR=<Download directory - default is where the bot runs from>
TORRENTS_DIR=<Torrent files directory - default is DOWNLOAD_DIR/torrents>
ADMINS_CHATID=<Telegram chat Ids of admins seperated with comma>
UPDATE_INTERVAL=<time interval to check for a new release (0 to disable) - default is 1d>
LOCAL_API_ROOT=<Local API root - if you have a telegram-bot-api running on your machine, you can use http://127.0.0.1:8081>
```

## Prebuilt Docker images

[The docker images are hosted on GitHub packages](https://github.com/deanshub/downloader/pkgs/container/downloader). You can use them by pulling the image:

```bash
docker pull ghcr.io/deanshub/downloader
```

The image is built for multiple arches, which will be downloaded automatically based on the current machine arch:

-   linux/amd64
-   arm64
-   armv7 (for Raspberry Pi 3)

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
