const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const spawnSync = child_process.spawnSync;
const DIR = path.join(process.env.HOME, ".prompts");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
const contextFileName = path.join(DIR, "context.lock");

function cleanPath(str) {
  let id = "";
  const filename = slugify(str);
  const fp = () => path.join(DIR, (filename + id).replace(/_+/g, "_") + ".md");
  let n = fp();
  while (fs.existsSync(n)) {
    id = id + 1;
    id = parseInt(id);
    n = fp();
  }
  return fp();
}

const logResponse = (response) => {
  if (process.env.HEYC_TMP_FILE) {
    fs.writeFileSync(process.env.HEYC_TMP_FILE, response);
  } else {
    process.stdout.write(response);
  }
};

async function fetchPrompt(messages) {
  let err = false;
  try {
    var res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7,
      }),
    });

    var text = await res.clone().text();
    var json = await res.json();
  } catch (e) {
    err = true;
  }
  if (!json) err = true;
  return [json.choices?.[0]?.message?.content || text, err];
}

async function smartTitle(ledger, maxChar = 32) {
  const [title, err] = await fetchPrompt([
    ...ledger,
    {
      role: "user",
      content: "give a title for the previous prompt with a maximum character count of " + maxChar,
    },
  ]);
  if (err) throw new Error(err);
  return title;
}

function slugify(str) {
  return str
    .slice(0, 128)
    .split("")
    .map((char) => ("abcdefghijklmnopqrstuvwxyz0123456789".includes(char.toLowerCase()) ? char : "_"))
    .join("");
}

async function shouldDateMakeNew(contextFileName) {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  if (!fs.existsSync(contextFileName)) return true;
  const contextDate = fs.statSync(contextFileName).mtime.getTime();
  const currentDate = new Date().getTime();
  if (currentDate - contextDate > TWO_HOURS) {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const ans = await new Promise((rs) =>
      rl.question("Context is older than 2hrs, create a new one?", (answer) => {
        rl.close();
        rs(answer);
      })
    );
    if (ans === "y") return true;
    return false;
  }
}

(async function main() {
  if (process.argv[2] === "--recent") {
    const num = !isNaN(parseInt(process.argv[3])) ? parseInt(process.argv[3]) : 0;
    if (process.argv[3] || !fs.existsSync(contextFileName)) {
      const f = child_process
        .execSync("ls -lt $HOME/.prompts/*.md")
        .toString()
        .split("\n")
        .filter(Boolean)
        .map((f) => f.split(" ").slice(-1).join(""))[num];
      if (!fs.existsSync(f)) return console.log("no file 🤷‍♂️");
      logResponse(fs.readFileSync(f).toString().trim());
      return;
    }
    const {
      info: { file },
    } = JSON.parse(fs.readFileSync(contextFileName).toString());
    logResponse(fs.readFileSync(file).toString().trim());
    return;
  }
  const shouldMakeNew = await shouldDateMakeNew(contextFileName);

  const file = child_process.execSync("mktemp");

  const args = [...process.argv.slice(2)];
  if ((args[0] || "").startsWith("--")) args.shift();
  fs.writeFileSync(file, args.join(" "));

  spawnSync(process.env.EDITOR || "nvim", [file], {
    stdio: "inherit",
  });

  try {
    var pmpt = fs.readFileSync(file).toString().trim();
  } catch (e) {}
  if (!pmpt) process.exit(1);

  function newContext() {
    const file = cleanPath(pmpt);
    const obj = { context: [], info: { file } };
    fs.writeFileSync(contextFileName, JSON.stringify(obj));
  }

  if (process.argv[2] === "--new" || !fs.existsSync(contextFileName) || shouldMakeNew) {
    newContext();
  }

  const contextObj = JSON.parse(fs.readFileSync(contextFileName).toString().trim());

  let chatLedger = contextObj.context;
  let trimLedger = 0;
  if ((process.argv[2] || "").startsWith("--trim=")) {
    const n = parseInt(process.argv[2].slice("--trim=".length));
    if (!Number.isNaN(n)) trimLedger = n;
  }
  chatLedger.push({
    role: "user",
    content: pmpt,
  });

  process.stdout.write(String(pmpt) + "\n\n");

  const [response, err] = await fetchPrompt(chatLedger.slice(trimLedger));

  if (!err) {
    chatLedger.push({ role: "assistant", content: response });

    logResponse(response);

    try {
      if (contextObj.info.smartTitle === undefined) {
        const title = await smartTitle(chatLedger);
        if (title) {
          contextObj.info.smartTitle = title.replace(/^"/, "").replace(/"$/, "");
          contextObj.info.cleanSmartTitle = cleanPath(contextObj.info.smartTitle);
          contextObj.info.file = contextObj.info.cleanSmartTitle;
        }
      }
    } catch (e) {
      contextObj.info.smartTitle = null;
      contextObj.info.cleanSmartTitle = null;
    }
    fs.writeFileSync(contextFileName, JSON.stringify(contextObj));

    fs.writeFileSync(
      contextObj.info.file,
      (!!contextObj.info.smartTitle ? "# " + contextObj.info.smartTitle + "\n\n" : "") +
        chatLedger
          .map((m) => `### ${m.role.slice(0, 1).toUpperCase() + m.role.slice(1)}:\n${m.content}`)
          .join("\n\n------\n\n")
    );
  } else {
    process.stdout.write(response);
  }
})();
