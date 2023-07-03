function imgbot() {
  local prompt="$@"
  local api_key="${OPENAI_API_KEY}"
  local response=$(curl -s "https://api.openai.com/v1/images/generations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${api_key}" \
    -d "{\"model\": \"image-alpha-001\", \"prompt\": \"${prompt}\", \"num_images\": 1, \"size\": \"1024x1024\", \"response_format\": \"url\"}")
  local image_url=$(echo "${response}" | jq -r '.data[0].url')
  # local image_file=$(basename "${image_url}")
  if [[ -z $image_url ]]; then
    echo "img_url is empty"
  else
    local outfile="$(mktemp).jpg"
    curl -s "${image_url}" -o "$outfile"
    open "${outfile}"
  fi
}
