#uses venv and autoenv
#venv: https://docs.python.org/3/library/venv.html
#autoenv: https://github.com/hyperupcall/autoenv
#autoenv authorized envs are located in ~/.local/state/autoenv/authorized_list
function newpyenv() {
  local DIR=$PWD
  if [ $# -ne 0 ]; then
    DIR="${PWD}/$1"
  fi
  mkdir -p $DIR
  local ACT="${DIR}/bin/activate"
  local ENV_FILE="${DIR}/.env"
  echo "source ${ACT}" >"${ENV_FILE}"
  autoenv_authorize_env "${ENV_FILE}"
  python3 -m venv $DIR
  while [[ ! -f ${ACT} ]]; do
    sleep 1 # Wait for 1 second before checking again
  done
  source "${ACT}" && sleep 1 && cd $DIR
}
