#!/bin/bash
set -euo pipefail

# the %/ removes a trailing slash (if it exists)
scripts_directory=$(dirname -- $(realpath "$0"))
audio_directory=${PATH_TO_AUDIO%/} 
cache_directory=${PATH_TO_CACHE%/}

# Try to create it (so ensure that it exists).
mkdir -p ${cache_directory}

last_hash_file=${cache_directory}/audio-hash

# Touch the hash file to ensure that it exists.
touch ${last_hash_file}

current_hash=$(find ${audio_directory} -type f | sort | xargs -i du -b {} | md5sum | cut -d " " -f 1)
last_hash=$(cat ${last_hash_file})

if [[ ${current_hash} != ${last_hash} ]]; then
  echo "The database is outdated and will now be updated…"
  # First run the update script, then update the hash.
  # This way it will retry in case updating the database fails (or was aborted).
  ${scripts_directory}/update-database.sh
  echo ${current_hash} > ${last_hash_file}
fi

