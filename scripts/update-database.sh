#!/bin/bash
set -euo pipefail

# the %/ removes a trailing slash (if it exists)
audio_directory=${PATH_TO_AUDIO%/} 
cache_directory=${PATH_TO_CACHE%/}

cover_directory=${cache_directory}/cover

# To ensure a zero-downtime update of the database, we create another one next to the possibly existing one.
# When we are done, we overwrite the old one with the new one.
# We use a timestamp in the temp name so in case of concurrent runs of this script, the last one saving wins.
# But at least the concurrent runs won't interfere with each other.
timestamp=$(date +%s)
database_path_temp=${cache_directory}/database-new-${timestamp}.js
database_path=${cache_directory}/database.js


mkdir --parents "${cover_directory}"

echo "\"use strict\";" >> "${database_path_temp}"
echo "var cds = [" >> "${database_path_temp}"

find -H "${audio_directory}" -name "*.mp3" -print0 | sort -z | while read -r -d $'\0' audio_path; do
  echo ${audio_path}

  category=$(dirname "${audio_path}" | sed -e "s|^${audio_directory}||" | sed -e "s|^/||")

  relative_audio_path=audio/$(echo "${audio_path}" | sed -e "s|^${audio_directory}/||")

  name=$(echo "${audio_path}" | sed -e "s|^${audio_directory}/||" | sed -e "s|^${category}/${category} - ||" | sed -e "s/.mp3$//")

  cover_path=$(echo "${audio_path}" | sed -e "s|^${audio_directory}|${cover_directory}|" | sed -e "s/mp3$/jpg/")
  
  relative_cover_path=cache/cover/$(echo "${cover_path}" | sed -e "s|^${cover_directory}/||")

  mkdir --parents "$(dirname "${cover_path}")"
  # remove the possibly existing file because the cover might have been updated
  rm -f "${cover_path}"


  # Check that the file does indeed have a cover picture. Otherwise fail immediately.
  set +e
  # ffmpeg consumes $1 and this causes the filename in a loop to be destroyed
  # https://stackoverflow.com/a/52374405
  ffmpeg -loglevel quiet -i "${audio_path}" -an -vcodec copy "${cover_path}" < /dev/null
  if [[ $? -eq 1 ]]; then
    echo "This file has no cover image. Stopping here."
    exit 1
  fi
  set -e

  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -sexagesimal "${audio_path}" | head -c -8)

  echo "{\"name\": \"${name}\", \"category\": \"${category}\", \"audio\": \"${relative_audio_path}\", \"cover\": \"${relative_cover_path}\", \"duration\": \"${duration}\"}," >> "${database_path_temp}"

done
echo "];" >> "${database_path_temp}"
mv "${database_path_temp}" "${database_path}"

echo "Done."

