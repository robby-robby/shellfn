"use strict";

const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

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

async function fetchPrompt(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
    }),
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content || null;
}

async function smartTitle(ledger, maxChar = 32) {
  const title = fetchPrompt([
    ...ledger,
    {
      role: "user",
      content:
        "give a title for the previous prompt with a maximum character count of " +
        maxChar,
    },
  ]);
  return title;
}

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

async function shouldDateMakeNew(contextFileName) {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const contextDate = fs.statSync(contextFileName).mtime.getTime();
  const currentDate = new Date().getTime();
  if (currentDate - contextDate > TWO_HOURS) {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const ans = new Promise((rs) =>
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
  const file = child_process.execSync("mktemp");

  const args = [...process.argv.slice(2)];
  if ((args[0] || "").startsWith("--")) args.shift();
  fs.writeFileSync(file, args.join(" "));

  child_process.spawnSync(process.env.EDITOR || "vim", [file], {
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

  if (
    process.argv[2] === "--new" ||
    !fs.existsSync(contextFileName) ||
    (await shouldDateMakeNew(contextFileName))
  ) {
    newContext();
  }

  const contextObj = JSON.parse(
    fs.readFileSync(contextFileName).toString().trim()
  );

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

  const response = await fetchPrompt(chatLedger.slice(trimLedger));

  if (response) {
    chatLedger.push({ role: "assistant", content: response });

    process.stdout.write(response);

    try {
      if (contextObj.info.smartTitle === undefined) {
        const title = await smartTitle(chatLedger);
        if (title) {
          contextObj.info.smartTitle = title
            .replace(/^"/, "")
            .replace(/"$/, "");
          contextObj.info.cleanSmartTitle = cleanPath(
            contextObj.info.smartTitle
          );
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
      (!!contextObj.info.smartTitle
        ? "# " + contextObj.info.smartTitle + "\n\n"
        : "") +
        chatLedger
          .map(
            (m) =>
              `### ${m.role.slice(0, 1).toUpperCase() + m.role.slice(1)}:\n${
                m.content
              }`
          )
          .join("\n\n------\n\n")
    );
  } else {
    console.log(JSON.stringify(json, null, 4));
  }
})();
