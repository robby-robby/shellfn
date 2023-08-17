const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const spawnSync = child_process.spawnSync;

//setup:
//assure that the directory for the prompts and settings exists
const promptsDir = path.join(process.env.HOME, ".prompts");
if (!fs.existsSync(promptsDir)) fs.mkdirSync(promptsDir);
//determine and set context filename
const contextFileName = path.join(promptsDir, "context.lock");

//determine and set model filename
const modelfile = path.join(promptsDir, "/.heyc_model");

//if the model file does not exist, create it and write the default model to it
if (!fs.existsSync(modelfile)) {
  fs.writeFileSync(modelfile, "gpt-3.5");
}

//read the model from the file
const HEYC_MODEL = fs.readFileSync(modelfile).toString().trim();

//write the model to the model file
function writeModelConfig(heyc_model) {
  fs.writeFileSync(modelfile, heyc_model);
}

//given a string, return a path that does not exist
//if the path exists, add a number to the end of the filename
function cleanPath(str) {
  let id = "";
  const filename = slugify(str);
  const fp = () => path.join(promptsDir, (filename + id).replace(/_+/g, "_") + ".md");
  let n = fp();
  while (fs.existsSync(n)) {
    id = id + 1;
    id = parseInt(id);
    n = fp();
  }
  return fp();
}

//write the log to a log file if it is named
//in the variable
const logResponse = (response) => {
  if (process.env.HEYC_TMP_FILE) {
    fs.writeFileSync(process.env.HEYC_TMP_FILE, response);
  } else {
    process.stdout.write(response);
  }
};

//Fetch models from open ai using the api key
//and return the json response
async function listModels(KEY = process.env.OPENAI_API_KEY) {
  const res = await fetch("https://api.openai.com/v1/engines", {
    headers: {
      Authorization: "Bearer " + KEY,
    },
  });
  return res.json();
}

//Fetch prompt from open ai using the api key
//and return the json response
//messages is an array of objects with role and content
//role is either user or assistant
//the wanted response should be in json
//if there is an error and the response is not json return text
//return [response, error] which is very much like golang return types
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
        model: HEYC_MODEL,
        messages,
        temperature: 0.7,
      }),
    });

    //if there is an error json could potentially not be returned
    //if there is no json parse the response as text and return that
    var text = await res.clone().text();
    var json = await res.json();
  } catch (e) {
    err = true;
  }
  if (!json) err = true;
  return [json.choices?.[0]?.message?.content || text, err];
}

//fetch a prompt from open ai to give the content a title
//tell the ai to limit the response to maxChar characters
//include the ledger; or previous messages, in the prompt
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

//turn the string into something that can be used as a friendly url/filename, spaces are bad
//alphanumeric characters are good
function slugify(str) {
  return str
    .slice(0, 128)
    .split("")
    .map((char) => ("abcdefghijklmnopqrstuvwxyz0123456789".includes(char.toLowerCase()) ? char : "_"))
    .join("");
}

//given a context file name if it is older than 2 hours
//prompt the user to create a new one
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

//return a list of all models that begin with gpt
async function numList() {
  const res = await listModels();
  const listm = res.data.filter((d) => d.id.startsWith("gpt")).map((d, i) => d.id);
  return listm;
}
/*
  command line flags are as follow
  --getm - get the current model
  --listm - list all models
  --setm=<n> - set the current model to the nth model in the list
  --recent - output the most recent prompt read from the context file
  --trim=<n> - trim the first <n> responses from the context when fetching the next prompt
  --new - create new conversation / context 
*/
(async function main() {
  if (process.argv[2] === "--getm") {
    //log current model and quit
    return console.log(HEYC_MODEL);
  }
  if (process.argv[2] === "--listm") {
    console.log((await numList()).map((m, i) => `${i}. ${m}`).join(`\n`));
    process.exit(0);
  }

  if ((process.argv[2] || "").startsWith("--setm=")) {
    const list = await numList();
    const index = parseInt(process.argv[2].split("=")[1]);
    if (isNaN(index) || list[index] == null) return console.log("invalid index");
    writeModelConfig(list[index]);
    console.log(`model set: ${list[index]}`);
    process.exit(0);
  }

  if (process.argv[2] === "--recent") {
    const num = !isNaN(parseInt(process.argv[3])) ? parseInt(process.argv[3]) : 0;
    //if a number is specified which will default to zero if not get this <nth> file from most recent conversations
    //only the most recent conversation is stored in the context file therefore we really on file dates for numbering past that
    if (process.argv[3] || !fs.existsSync(contextFileName)) {
      const f = child_process
        //get all markdown files in the prompts directory sorted by date
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
  //determine if we should create a new context file,
  //if the context file is older than 2hrs ask the user if they want to create a new one
  const shouldMakeNew = await shouldDateMakeNew(contextFileName);

  //Since the prompt from the user could be multiple lines and will
  //be put into a nice editor (vim) create a temporary file to store the prompt
  //and open it in the editor in a new process
  const file = child_process.execSync("mktemp");
  const args = [...process.argv.slice(2)];

  let contextObj = null;
  if (process.argv[2] === "--retry") {
    contextObj = JSON.parse(fs.readFileSync(contextFileName).toString().trim());
    const a = contextObj.context.pop();
    const u = contextObj.context.pop();
    fs.writeFileSync(file, u.content);
  } else {
    if ((args[0] || "").startsWith("--")) args.shift();
    fs.writeFileSync(file, args.join(" "));
  }

  spawnSync(process.env.EDITOR || "nvim", [file], {
    stdio: "inherit",
  });

  //read the prompt from the file
  //if the file is blank user quit the editor and is canceling the prompt
  try {
    var prompt = fs.readFileSync(file).toString().trim();
  } catch (e) {}
  if (!prompt) process.exit(1);

  //if the context file doesn't exist or the --new flag is passed create a new context
  //or if the context file is older than 2hrs create a new context
  if (process.argv[2] === "--new" || !fs.existsSync(contextFileName) || shouldMakeNew) {
    newContext(prompt);
  }
  if (contextObj === null) contextObj = JSON.parse(fs.readFileSync(contextFileName).toString().trim());

  //context file stores current conversion
  /*  it looks like this:
  {
    context: [] //this is the chat ledger which stores each message
    info: {
      file: "path/to/conversation/file.md",
      smartTitle: "title of the conversation"
      cleanSmartTitle: "title_of_the_conversation.md"
    }
  }

  each message looks like this:
  { role: "assistant"|"user", content: <message> }

  */

  //Create new context, create a new conversation
  function newContext(p) {
    const file = cleanPath(p);
    const obj = { context: [], info: { file } };
    fs.writeFileSync(contextFileName, JSON.stringify(obj));
  }

  //load chat ledger from context
  let chatLedger = contextObj.context;
  let trimLedger = 0;
  //determine if its if we should --trim the chat ledger
  if ((process.argv[2] || "").startsWith("--trim=")) {
    const n = parseInt(process.argv[2].slice("--trim=".length));
    if (!Number.isNaN(n)) trimLedger = n;
  }

  //add prompt to ledger
  chatLedger.push({
    role: "user",
    content: prompt,
  });

  //write prompt to stdout
  process.stdout.write(String(prompt) + "\n\n");

  //fetch prompt from openai api
  const [response, err] = await fetchPrompt(chatLedger.slice(trimLedger));

  //if not an error log the response and write it to the ledger
  //if there is an error log it and exit
  if (!err) {
    chatLedger.push({ role: "assistant", content: response });

    logResponse(response);

    try {
      if (contextObj.info.smartTitle === undefined) {
        //if the smart title is not set, because conversation is new, try to set it
        //if the smart title fetching fails thats okay we can just use the original file name
        const title = await smartTitle(chatLedger);
        if (title) {
          //clean up the reponse and set the smart title
          //save the information in the context object
          contextObj.info.smartTitle = title.replace(/^"/, "").replace(/"$/, "");
          contextObj.info.cleanSmartTitle = cleanPath(contextObj.info.smartTitle);
          contextObj.info.file = contextObj.info.cleanSmartTitle;
        }
      }
    } catch (e) {
      //if the smart title fetching fails thats okay we can just use the original file name
      contextObj.info.smartTitle = null;
      contextObj.info.cleanSmartTitle = null;
    }
    //synchronize our context object with the context file and write the conversation to the conversation file
    fs.writeFileSync(contextFileName, JSON.stringify(contextObj));
    //write the conversation in the style of markdown
    //the title is smartitle if it exists otherwise its just the original file name
    fs.writeFileSync(
      contextObj.info.file,
      (!!contextObj.info.smartTitle ? "# " + contextObj.info.smartTitle + "\n\n" : "") +
        chatLedger
          //the role of each message is either assistant or user and is a markdown subheading
          .map((m) => `### ${m.role.slice(0, 1).toUpperCase() + m.role.slice(1)}:\n${m.content}`)
          .join("\n\n------\n\n")
    );
  } else {
    //if there is an error log it and exit
    process.stdout.write(response || "error no response");
  }
})();
