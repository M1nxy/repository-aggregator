console.log('Hello world') // sanity check
const fetch = require('node-fetch') // mf windows sometimes drives me up the wall
const fs = require("fs"); // writes out to repo.txt

fetchParcility = async () => {  // old reliable database
    let raw = (await (await fetch("https://api.parcility.co/db/repos")).json()).data
    let parcilityRepos = []
    for (let repository of raw){
        if(!parcilityRepos.includes(repository.url)){
            parcilityRepos.push(repository.url)
        }
    }
    return parcilityRepos
}

fetchCanister = async () => { // modern sileo database
    let raw = (await (await fetch("https://api.canister.me/v1/community/repositories/search?query=.&responseFields=uri")).json()).data
    let canisterRepos = []
    for (let repository of raw){
        if(!canisterRepos.includes(repository.uri)){
            canisterRepos.push(repository.uri)
        }
    }
    return canisterRepos
}

fetchSpartacus = async () => { // slow database
    let raw = (await (await fetch("https://spartacusdev.herokuapp.com/api/search/%20")).json()).data
    let spartacusRepos = []
    for (let repository of raw){
        if(!spartacusRepos.includes(repository.repo)){
            spartacusRepos.push(repository.repo)
        }
    }
    return spartacusRepos
}

fetchiOSRepoUpdates = async () => { // only returns most recent 50 due to endpoint limitation -> hopefully i find some documentation or a better endpoint
    let raw = (await (await fetch("https://api.ios-repo-updates.com/1.0/search/?s=%20")).json()).packages
    let iOSRepoUpdatesRepos = []
    for (let package of raw){ // mf package bc of search endpoint
        if(!iOSRepoUpdatesRepos.includes(package.repository.uri)){
            iOSRepoUpdatesRepos.push(package.repository.uri)
        }
    }
    return iOSRepoUpdatesRepos
}

cleanMerge = async (array1, array2) => {
    let raw = array1.concat(array2)
    return raw.filter((item, pos) => raw.indexOf(item) === pos)
}

fetchRepos = async () => { // no error checking bc im insanely lazy
    let repos = []
    repos = await cleanMerge(repos, await fetchParcility())
    repos = await cleanMerge(repos, await fetchCanister())
    repos = await cleanMerge(repos, await fetchSpartacus())
    repos = await cleanMerge(repos, await fetchiOSRepoUpdates())
    return repos
}

fetchRepos().then(data =>{
    fs.writeFile("./repos.txt", data.join('\n'), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
})
