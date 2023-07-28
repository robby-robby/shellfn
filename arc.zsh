#!/bin/zsh

arc()
{
  local archiveDir="$HOME/etc/projects/archive/"
  local dir=$(basename $1)
  mv "${projectsDir}${dir}" $archiveDir &&
    echo archived $dir 
}
unarc()
{
  local archiveDir="$HOME/etc/projects/archive/"
  local projectsDir="$HOME/etc/projects/"
  local dir=$(basename $1)
  mv "${archiveDir}${dir}" "${projectsDir}${dir}" &&
    echo unarchived $dir 
}

