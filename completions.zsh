# File: ~/.zsh_completion
# Function: _unarc_complete
# Description: Custom completion function for the unarc command

_unarc_complete() {
  local -a completions
  local curcontext="$curcontext" state line

  # Get list of directories in archive
  completions=($(
    command ls -d /Users/robertpolana/etc/projects/archive/*(/)
    2>/dev/null
  ))

  # Set completions
  _wanted directories expl 'directories' compadd -a
  completions
}
compdef _unarc_complete unarc
fpath=(/Users/robertpolana/etc/projects/shellfn/completions.zsh $fpath)
