function __heyfn() {

  __JSTMP=$(mktemp)
  cat <<'EOF' >"${__JSTMP}"
  (async function main() {
    const fs = require("fs");
    const path = require("path");

    const pureprompt = fs.readFileSync(process.env.__TMPFILE, "utf8");
    const contents =
      process.env.__PRETEXT + pureprompt;

    console.log(contents)

    const apikey = process.env.OPENAI_API_KEY;

    const DIR = path.join(process.env.HOME, ".prompts");

    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

    function slugify(str) {
      return str
        .slice(0, 128)
        .split("")
        .map((char) =>
          "abcdefghijklmnopqrstuvwxyz0123456789".includes(char.toLowerCase())
            ? char
            : "_"
        )
        .join("");
    }

    function cleanPath(str) {
      let id = "";
      const filename = slugify(str);
      const fp = ()=> path.join(DIR, (filename + id).replace(/_+/g, "_") + ".md");
      let n = fp();
      while (fs.existsSync(n)) {
        id = id + 1;
        id = parseInt(id);
        n = fp();
      }
      return fp();
    }

    const msgBody = { role: "user", content: contents };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apikey,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [msgBody],
        temperature: 0.7,
      }),
    });
    const json = await res.json();
    const response = json.choices?.[0]?.message?.content;

    fs.writeFileSync(
      cleanPath(pureprompt),
      `> ${contents}\n\n------------------\n\n ${response}`
    );

    process.stdout.write(response);
  })();
EOF

  __PRETEXT="${__CUSTOMPRETEXT}"
  __TMPFILE="$(mktemp)"

  if [ "$__NOVIM" != "1" ]; then
    vim "$__TMPFILE"
  else
    echo $__GPT_PROMPT >"$__TMPFILE"
  fi

  if [[ -s $__TMPFILE ]]; then

    if [ "$1" = false ]; then
      cat $__TMPFILE
      echo ""
      echo "------------------------"
      echo ""
    fi

    __PRETEXT=${__PRETEXT} __TMPFILE=${__TMPFILE} node "${__JSTMP}"

  else
    echo "File is empty"
  fi

  # Remove the temporary script file

  rm "${__JSTMP}"
  rm "${__TMPFILE}"

}

function ___heycodeonly() {
  __CUSTOMPRETEXT="Without any extra text OR using code block highlighting, "
  __GPT_PROMPT=$@
  __NOVIM=1
  __heyfn
}

function heycode() {
  __CUSTOMPRETEXT=""
  __NOVIM=0
  __heyfn
}

function hey() {
  __CUSTOMPRETEXT=""
  __GPT_PROMPT=$@
  __NOVIM=1
  __heyfn
}

function heyc() {
  node /Users/robertpolana/etc/projects/shellfn/heyc.js $@
}
