# File extension for the notes
note_ext="md"
# fzf_opts="--height 50%"

# Preview script part of FZF.vim. Defaults to something else if not present (but
# not as fancy)
# FZF_PREVIEW="$HOME/.vim/plugged/fzf.vim/bin/preview.sh"

# Enable colors if stdout is a tty
if [ -t 1 ]; then
  col_info=$(tput setaf 4)
  col_warn=$(tput setaf 3)
  col_error=$(tput setaf 1)
  col_rst=$(tput sgr0)
fi

# Interactive if stdin is a tty
if [ -t 0 ]; then
  interactive=1
else
  interactive=0
fi

error() {
  echo "${col_error}Error:${col_rst} $@" >&2
}

abort() {
  error "$@"
  exit 1
}

if [ "$NOTES_DIR" = '' ]; then
  NOTES_DIR="$HOME/.prompts"
fi

if [ "$EDITOR" = '' ]; then
  EDITOR='vi'
fi

if [ ! -d "$NOTES_DIR" ]; then
  error "'$NOTES_DIR' does not exist or isn't a directory"
  error "Create the directory or set NOTES_DIR in the environment"
  exit 1
fi

search_fulltext=0
delete_note=0

while getopts 'hfd' opt; do
  case $opt in
  f)
    shift
    search_fulltext=1
    ;;
  d)
    shift
    delete_note=1
    ;;
  *)
    echo "Usage:"
    echo "   note <note-name>    Open or create <note-name> in \$EDITOR"
    echo "   note                Use FZF to find a note and open it in \$EDITOR"
    echo "   note -f             Use FZF to start a full text search in all notes"
    echo ""
    echo "Use '-d' with the above commands to delete a note instead of opening it"
    echo ""
    echo "Environment variables used for configuration:"
    echo "  NOTE_DIR:  $NOTES_DIR"
    echo "  EDITOR:    $EDITOR"
    exit 1
    ;;
  esac
done

exec_open_note() {
  file="$NOTES_DIR/$1.$note_ext"

  if [ "$delete_note" -eq 1 ]; then
    exec rm -i "$file"
  fi

  if [ "$interactive" -eq 1 ]; then
    exec $EDITOR "$NOTES_DIR/$1.$note_ext"
  else
    # Non interactive use, redirect stdin
    exec cat >>"$file"
  fi
}

list_notes() {
  ls -t "$NOTES_DIR" | sed "s/\.$note_ext\$//"
}

dump_notes() {
  col_file=$(tput setaf 6)
  col_line=$(tput setaf 3)
  col_rst=$(tput sgr0)

  # Dump notes by modification time (more recent first)
  ls -t "$NOTES_DIR" | while read file; do
    clean_file=$(echo $file | sed "s/\.$note_ext\$//")
    full_file="$NOTES_DIR/$file"

    cat -n "$full_file" | sed 's/^ *//' | grep -v '^[0-9]*\s*$' |
      sed "s,^\([0-9]*\),${col_file}${clean_file}${col_rst}:${col_line}\1${col_rst}:,"
  done
}

if [ -x "$FZF_PREVIEW" ]; then
  preview="$FZF_PREVIEW $NOTES_DIR/{1}.$note_ext:{2}"
else
  preview="cat $NOTES_DIR/{1}.$note_ext"
fi

if [ -n "$1" ]; then
  # We got a note name as argument, create or open it
  exec_open_note "$1"
else
  # No argument, start FZF to search through existing notes
  if [ "$interactive" -eq "1" ]; then

    if [ "$search_fulltext" = '1' ]; then
      choice=$(dump_notes | fzf -d ':' --ansi +m --preview-window +{2}-5 --preview "$preview" $fzf_opts)
    else
      choice=$(list_notes | fzf -d ':' +m --preview "$preview" $fzf_opts)
    fi

    if [ -z "$choice" ]; then
      exit 1
    fi

    note=$(echo "$choice" | sed 's/:.*//')

    exec_open_note "$note"
  else
    abort "note without arguments when the input isn't a terminal"
  fi
fi
