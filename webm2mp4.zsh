#!/bin/zsh
#
webm2mp4() {
  input_file="$1"
  if [ ! -f "$input_file" ]; then
    echo "File not found: $input_file"
    return 1
  fi
  output_file="${input_file%.webm}.mp4"
  ffmpeg -i "$input_file" -vcodec libx264 -acodec aac "$output_file"
}
