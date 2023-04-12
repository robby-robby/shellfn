function fiddle {
  if [[ "$1" == "new" ]]; then
    psql -U postgres -c 'DROP DATABASE fiddle;'
    psql -U postgres -c 'CREATE DATABASE fiddle;'
  elif
    [[ "$1" == "vim" ]]
  then
    local TMPSQL=$(mktemp)
    vim $TMPSQL
    psql -U postgres -d fiddle -f $TMPSQL
  else
    psql -U postgres -d fiddle -f $1
  fi

}
