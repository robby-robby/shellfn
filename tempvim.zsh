function tempvim() {
  local tempfile="$(mktemp)"
  vim "$tempfile"
  source "$tempfile"
  rm "$tempfile"
}
