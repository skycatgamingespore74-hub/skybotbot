import { execSync } from "child_process";

const token = process.env.GITHUB_TOKEN; // Ton token stocké
const username = "skycatgamingespore74"; // ton username GitHub
const repo = "skybot bot";

execSync(
  `git remote set-url origin https://${username}:${token}@github.com/skycatgamingespore74-hub/${repo}.git`
);
execSync("git add .");
execSync('git commit -m "Push automatique du bot"');
execSync("git push -u origin main");