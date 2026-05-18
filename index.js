import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { writeFile } from "fs/promises";
import moment from "moment";
import simpleGit from "simple-git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = resolve(__dirname, "./data.json");
const git = simpleGit({ baseDir: __dirname });

const startDate = "2024-01-01";
const endDate = "2026-12-31";

const getExistingDates = async () => {
  const logOutput = await git.raw(["log", "--pretty=format:%ad", "--date=short", "main"]);

  return new Set(
    logOutput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line >= startDate && line <= endDate)
  );
};

const buildDateRange = (startDate, endDate) => {
  const dates = [];
  const current = moment(startDate);
  const end = moment(endDate);

  while (current.isSameOrBefore(end, "day")) {
    dates.push(current.format("YYYY-MM-DD"));
    current.add(1, "day");
  }

  return dates;
};

const makeCommits = async (goalUniqueDates, shouldPush = false) => {
  const existingDates = await getExistingDates();
  const allPossibleDates = buildDateRange(startDate, endDate);
  const missingDates = allPossibleDates.filter((date) => !existingDates.has(date));
  const existingCount = existingDates.size;
  const needed = Math.max(0, goalUniqueDates - existingCount);

  if (needed === 0) {
    console.log(`Already have ${existingCount} unique commit dates from ${startDate} to ${endDate}.`);
    return;
  }

  const datesToCreate = missingDates.slice(0, needed);

  if (datesToCreate.length < needed) {
    console.warn(
      `Only ${datesToCreate.length} available dates remain in the ${startDate} to ${endDate} range. Creating those.`
    );
  }

  for (let i = 0; i < datesToCreate.length; i += 1) {
    const date = datesToCreate[i];
    const commitDate = `${date}T12:00:00Z`;
    const data = { date };

    console.log(`Creating commit ${i + 1}/${datesToCreate.length} for ${date}`);

    await writeFile(path, JSON.stringify(data, null, 2));
    await git.add([path]);
    await git.commit(`Commit for ${date}`, [path], { "--date": commitDate });
  }

  if (shouldPush) {
    await git.push();
  }

  console.log(`Finished creating ${datesToCreate.length} new unique commit date(s) from ${startDate} to ${endDate}.`);
};

const targetUniqueDates = Number(process.argv[2] || 100);
const shouldPush = process.argv.includes("--push");

makeCommits(targetUniqueDates, shouldPush).catch((error) => {
  console.error("Commit script failed:", error);
  process.exit(1);
});
