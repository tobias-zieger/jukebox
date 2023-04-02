FROM bash

RUN mkdir /jukebox
WORKDIR /jukebox

# Copy everything to the docker image. We are using .dockerignore to steer what
# is being copied. To see why dockerignore is important, look at
# https://shisho.dev/blog/posts/how-to-use-dockerignore/.
# The audio directory would inflate the docker image largely.
# This idea is used in https://stackoverflow.com/a/54616645 as well.
COPY . .

RUN apk update && \
    apk upgrade && \
    apk add --no-cache busybox-extras nginx ffmpeg bash

# We need those variables for the update script.
ENV PATH_TO_AUDIO="/jukebox/audio"
ENV PATH_TO_CACHE="/jukebox/cache"

RUN mv config/nginx.conf /etc/nginx/http.d/jukebox.conf

# To check that the system is up to date, apk list --upgradable should be empty.

# from here: https://wiki.alpinelinux.org/wiki/Upgrading_Alpine#Updating_package_lists
RUN echo $'\
#!/bin/bash\n\
apk update\n\
apk add --upgrade apk-tools\n\
apk upgrade --available' > /etc/periodic/daily/update-system.sh

RUN ln -s /jukebox/scripts/check-for-changed-files.sh /etc/periodic/15min/check-for-changed-files.sh

# Create a startup script that starts 2 processes in this Docker container.
RUN echo $'\
nginx -g "daemon off;" &\n\
P1=$!\n\
\n\
/usr/sbin/crond &\n\
P2=$!\n\
\n\
wait $P1 $P2\n\
\n\
exit $?' > /start.sh

CMD bash /start.sh

