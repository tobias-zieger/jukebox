#!/bin/bash
set -euo pipefail

# the %/ removes a trailing slash (if it exists)
audio_directory=${PATH_TO_AUDIO%/} 
cache_directory=${PATH_TO_CACHE%/}

# There are two different types of paths:
# 1. The absolute path of a file in the docker image, e.g., /jukebox/audio/blabla.mp3. The tools below work with the full path.
# 2. The relative path of a file as it's referenced by the webserver later, e.g., /audio/blabla.mp3. This path needs to go into the database file.


fixed_virtual_cache_directory=cache

audio_directory_name=audio
cover_directory_name=cover
cover_directory_full_path=${cache_directory}/${cover_directory_name}


# To ensure a zero-downtime update of the database, we create another one next to the possibly existing one.
# When we are done, we overwrite the old one with the new one.
# We use a timestamp in the temp name so in case of concurrent runs of this script, the last one saving wins.
# But at least the concurrent runs won't interfere with each other.
timestamp=$(date +%s)
database_path_temp=${cache_directory}/database-new-${timestamp}.js
database_path=${cache_directory}/database.js


mkdir --parents "${cover_directory_full_path}"

echo "\"use strict\";" >> "${database_path_temp}"
echo "var cds = [" >> "${database_path_temp}"

find -H "${audio_directory}" -name "*.mp3" -print0 | sort -z | while read -r -d $'\0' audio_path; do
  echo "${audio_path}"

  category=$(dirname "${audio_path}" | sed -e "s|^${audio_directory}||" | sed -e "s|^/||")

  cd_specific_path_segment=$(echo "${audio_path}" | sed -e "s|^${audio_directory}/||" | sed -e "s/mp3$//")
  relative_audio_path=${audio_directory_name}/${cd_specific_path_segment}mp3
  relative_cover_path=${fixed_virtual_cache_directory}/${cover_directory_name}/${cd_specific_path_segment}jpg
  absolute_cover_path=${cover_directory_full_path}/${cd_specific_path_segment}jpg
  
  name=$(echo "${audio_path}" | sed -e "s|^${audio_directory}/||" | sed -e "s|^${category}/${category} - ||" | sed -e "s/.mp3$//")

  mkdir --parents "$(dirname "${absolute_cover_path}")"
  # remove the possibly existing file because the cover might have been updated
  rm -f "${absolute_cover_path}"

  # Check that the file does indeed have a cover picture. Otherwise fail immediately.
  set +e
  # ffmpeg consumes $1 and this causes the filename in a loop to be destroyed
  # https://stackoverflow.com/a/52374405
  ffmpeg -loglevel quiet -i "${audio_path}" -an -vcodec copy "${absolute_cover_path}" < /dev/null
  if [[ $? -eq 1 ]]; then
    echo "This file has no cover image. Stopping here."
    exit 1
  fi
  set -e

  duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -sexagesimal "${audio_path}" | head -c -8)

  echo "{\"name\": \"${name}\", \"category\": \"${category}\", \"audio\": \"${relative_audio_path}\", \"cover\": \"${relative_cover_path}\", \"duration\": \"${duration}\"}," >> "${database_path_temp}"

done
echo "];" >> "${database_path_temp}"
echo "" >> "${database_path_temp}"
mv "${database_path_temp}" "${database_path}"

echo "Done."

