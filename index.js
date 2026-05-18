import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = resolve(__dirname, "./data.json");
const git = simpleGit({ baseDir: __dirname });

const makeCommits = async (count, shouldPush = false) => {
  for (let i = 1; i <= count; i += 1) {
    const x = random.int(0, 54);
    const y = random.int(0, 6);
    const date = moment().subtract(1, "y").add(1, "d").add(x, "w").add(y, "d").format();

    const data = { date };
    console.log(`Creating commit ${i}/${count} for ${date}`);

    await jsonfile.writeFile(path, data);
    await git.add([path]);
    await git.commit(date, { "--date": date });
  }

  if (shouldPush) {
    await git.push();
  }

  console.log(`Finished creating ${count} commit(s)${shouldPush ? " and pushed" : ""}.`);
};

const commitCount = Number(process.argv[2] || 100);
const shouldPush = process.argv.includes("--push");

makeCommits(commitCount, shouldPush).catch((error) => {
  console.error("Commit script failed:", error);
  process.exit(1);
});
