const fetch = require("node-fetch"); // mf windows sometimes drives me up the wall
const fs = require("fs"); // writes out to repo.txt
const { writeFile } = require("fs/promises");

let request = async (url) => {
	let res = await fetch(url);
	return await res.json();
}

fetchParcility = async () => {
  // old reliable database
  let raw = (await request("https://api.parcility.co/db/repos")).data;
  let parcilityRepos = [];
  for (let repository of raw) {
    if (!parcilityRepos.includes(repository.url)) {
      parcilityRepos.push(repository.url);
    }
  }
  return parcilityRepos;
};

fetchCanister = async () => {
  // modern sileo database
  let raw = (await request("https://api.canister.me/v1/community/repositories/search?query=.&responseFields=uri")).data;
  let canisterRepos = [];
  for (let repository of raw) {
    if (!canisterRepos.includes(repository.uri)) {
      canisterRepos.push(repository.uri);
    }
  }
  return canisterRepos;
};

fetchSpartacus = async () => {
  // slow database
  let raw = (await request("https://spartacusdev.herokuapp.com/api/search/%20")).data;
  let spartacusRepos = [];
  for (let repository of raw) {
    if (!spartacusRepos.includes(repository.repo)) {
      spartacusRepos.push(repository.repo);
    }
  }
  return spartacusRepos;
};

fetchiOSRepoUpdates = async () => {
  // only returns most recent 50 due to endpoint limitation -> hopefully i find some documentation or a better endpoint
  let raw = (await request("https://api.ios-repo-updates.com/1.0/search/?s=%20")).packages;
  let iOSRepoUpdatesRepos = [];
  for (let package of raw) {
    // mf package bc of search endpoint
    if (!iOSRepoUpdatesRepos.includes(package.repository.uri)) {
      iOSRepoUpdatesRepos.push(package.repository.uri);
    }
  }
  return iOSRepoUpdatesRepos;
};

fetchRepos = async () => {
  // no error checking bc im insanely lazy
  let [parcility, canister, spartacus, iosrepoupdates] = await Promise.all([
    // concurrently get all of the repo urls
    await fetchParcility(),
    await fetchCanister(),
    await fetchSpartacus(),
    await fetchiOSRepoUpdates(),
  ]);
  let repos = [
    // merge them into one array
    ...parcility,
    ...canister,
    ...spartacus,
    ...iosrepoupdates,
  ];
  return [...new Set(repos)];
};

(async () => {
  console.log("fetching repos");
  let repos = await fetchRepos();
  await writeFile("./repos.txt", repos.join("\n"), { encoding: "utf-8" });
  console.log("The file was saved!");
})();
