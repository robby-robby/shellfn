#!/bin/zsh
#
rename_files_with_underscores() {
  print -n "Are you sure you want to rename all files with spaces to underscores in the current directory? (y/n): "
  read proceed
  case $proceed in
  y* | Y*)
    for f in ./*' '*; do
      [ -f "$f" ] && mv -- "$f" "${f// /_}"
    done
    echo "Files renamed successfully."
    ;;
  *)
    echo "Operation canceled."
    ;;
  esac
}
