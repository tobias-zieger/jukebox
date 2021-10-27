#!/bin/bash
set -euo pipefail

cover_directory="cover"
audio_directory="audio"

mkdir --parents "${cover_directory}"

echo "cds = [" > database.js

find "${audio_directory}" -name "*.mp3" -print0 | while read -d $'\0' audio_path; do
  
  category=$(dirname "${audio_path}" | sed -e "s/^${audio_directory}//" | sed -e "s|^/||")
  
  name=$(echo "${audio_path}" | sed -e "s|^${audio_directory}/||" | sed -e "s|^${category}/${category} - ||" | sed -e "s/.mp3$//")
  
  cover_path=$(echo "${audio_path}" | sed -e "s/^${audio_directory}/${cover_directory}/" | sed -e "s/mp3$/jpg/")
  mkdir --parents "$(dirname "${cover_path}")"
  rm -f "${cover_path}"

  # ffmpeg consumes $1 and this causes the filename in a loop to be destroyed
  # https://stackoverflow.com/a/52374405
  ffmpeg -loglevel quiet -i "${audio_path}" -an -vcodec copy "${cover_path}" < /dev/null

  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -sexagesimal "${audio_path}" | head -c -8)
  
  echo "{\"name\": \"${name}\", \"category\": \"${category}\", \"audio\": \"${audio_path}\", \"cover\": \"${cover_path}\", \"duration\": \"${duration}\"}," >> database.js
done
echo "]" >> database.js

