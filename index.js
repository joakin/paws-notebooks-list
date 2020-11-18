const domino = require("domino");
const fetch = require("node-fetch");
const fs = require("fs");

const year = "2020";
const parentDir = "Parent directory/";
const baseURL = "https://public.paws.wmcloud.org/";

const args = process.argv.slice(2);

async function main() {
  let indexDocument = await getIndex();
  let users = keepEntries(getEntriesFromDOM(baseURL, indexDocument));
  console.error(`Got ${users.length} users`);

  let allNotebooks = [];
  for (let [i, user] of users.entries()) {
    console.error(`\n\nProcessing user ${i + 1}/${users.length}: ${user.name}`);
    let notebooks = keepEntries(await getNotebooks(0, user)).map(
      (notebook) => ({
        ...notebook,
        user: user.name,
        userHref: user.href,
      })
    );
    allNotebooks.push.apply(allNotebooks, notebooks);
  }
  console.log(JSON.stringify(allNotebooks, null, 2));
}

main().catch((err) => console.error(err.message));

function createDocument(text) {
  return domino.createDocument(text, true);
}

async function getIndex() {
  let text;
  let indexCachePath = "./index.cache";
  if (fs.existsSync(indexCachePath)) {
    text = fs.readFileSync(indexCachePath).toString();
  } else {
    let indexURL = `${baseURL}`; //?C=M&O=D`;
    console.error(`Fetching ${indexURL}`);
    let res = await fetch(indexURL);
    if (!res.ok) throw new Error("Request to index failed");
    text = await res.text();
    fs.writeFileSync(indexCachePath, text);
  }
  return createDocument(text);
}

function getEntriesFromDOM(url, document) {
  let trs = document.querySelectorAll("#list tbody>tr");
  if (!trs) {
    console.error("No trs found");
    return;
  }
  let entries = Array.from(trs).map((tr) => ({
    size: tr.children[1].textContent.trim(),
    date: tr.children[2].textContent.trim(),
    href: url + tr.children[0].querySelector("a").href,
    name: tr.children[0].querySelector("a").textContent.trim(),
  }));
  return entries;
}

function keepEntries(entries) {
  return entries.filter((u) => u.date.startsWith(`${year}-`));
}

async function getNotebooks(level = 0, entry) {
  console.error(`Fetching ${entry.href}`);
  let res = await fetch(entry.href);
  if (!res.ok) throw new Error(`Request to ${entry.href} failed`);
  let text = await res.text();
  let document = createDocument(text);
  let entries = getEntriesFromDOM(entry.href, document);
  let notebooks = entries.filter((e) => e.name.endsWith(".ipynb"));
  let folders = entries.filter(
    (e) =>
      e.name.endsWith("/") && e.name !== parentDir && e.name !== "node_modules/"
  );
  let folderPromises = [];
  for (let folder of folders) {
    if (level > 2) {
      console.error(`Skipping folder ${folder.name} at level > 2`);
    } else {
      console.error(`Processing folder ${folder.name}`);
      folderPromises.push(
        getNotebooks(level + 1, folder).then((ns) => {
          notebooks.push(...ns);
        })
      );
    }
  }
  await folderPromises;
  return notebooks;
}
