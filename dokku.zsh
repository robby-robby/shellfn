
function _dokku_push() {
  git push dokku master 
}
function _dokku_pushf() {
  git push -f dokku master 
}

function _dokku_init() {
  local name="${1:-$(basename $(pwd))}"
  git remote add dokku "dokku@dokku.me:$name"
  git remote get-url dokku
}

function _get_dokku_host() {
  git remote get-url dokku | cut -d":" -f1
}

function _get_dokku_ip() {
  grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}[[:space:]]+dokku\.me' /etc/hosts | awk '{print $1}'
}

function _get_app_name() {
  local app_name="${1:-$(git remote get-url dokku | cut -d":" -f2)}"
  echo "$app_name"
}

function _dokku_wire() {
  local subdomain_string="$1"
  if ! grep -qF "$subdomain_string" /etc/hosts; then
    echo "$subdomain_string" | sudo tee -a /etc/hosts >/dev/null
    echo "$subdomain_string added to /etc/hosts"
  else
    echo "$subdomain_string already in /etc/hosts"
  fi
}

function _dokku_unwire() {
  local subdomain_string="$1"
  if grep -qF "$subdomain_string" /etc/hosts; then
    sudo sed -i.bak "/$subdomain_string/d" /etc/hosts
    echo "$subdomain_string removed from /etc/hosts"
  else
    echo "$subdomain_string not found in /etc/hosts"
  fi
}

function _dokku_ssh() {
  ssh root@dokku.me
}

function _dokku_open() {
  local app_name="$1"
  open "http://${app_name}.dokku.me"
}

function _dokku_run_on_host() {
  # local dokku_host="$1"
  # shift
  ssh -t "dokku@dokku.me" "${@}"
}

function dokku() {
  local command="$1"
  case "$command" in
  push) _dokku_push  ;;
  pushf) _dokku_pushf  ;;
  init)
    shift
    _dokku_init "$@"
    ;;
  wire | unwire | open | ssh)
    local dokku_host="$(_get_dokku_host)"
    if [[ -z "$dokku_host" ]]; then
      echo "No dokku host found. Are you in a git repo with a dokku remote?"
      return 1
    fi
    local dokku_ip="$(_get_dokku_ip)"
    local app_name="$(_get_app_name "$2")"
    local subdomain_string="${dokku_ip} ${app_name}.dokku.me"
    case "$command" in
    wire) _dokku_wire "$subdomain_string" ;;
    unwire) _dokku_unwire "$subdomain_string" ;;
    ssh) _dokku_ssh ;;
    open) _dokku_open "$app_name" ;;
    esac
    ;;
  *) _dokku_run_on_host "$@" ;;
  esac
}
