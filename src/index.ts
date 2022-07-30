import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import { join } from 'path';

interface ResourceTypes {
	json: Record<string, any>;
	text: string;
	buffer: Buffer;
	arrayBuffer: ArrayBuffer;
}
async function request<Type extends keyof ResourceTypes>(url: string, type: Type): Promise<ResourceTypes[Type]> {
	let res = await fetch(url);
	return res[type]();
}

// i thought about this lmfao
let lists = [
	{
		url: 'https://api.parcility.co/db/repos',
		arrayKey: 'data',
		repoURLKey: 'url',
	},
	{
		url: 'https://api.canister.me/v1/community/repositories/search?query=.&responseFields=uri',
		arrayKey: 'data',
		repoURLKey: 'uri',
	},
	{
		url: 'https://spartacusdev.herokuapp.com/api/search/%20',
		arrayKey: 'data',
		repoURLKey: 'repo',
	},
];

// take 2
let fetchList = async ({ url, arrayKey, repoURLKey }: typeof lists[0]) => {
	let raw = (await request(url, 'json'))[arrayKey];
	let repos: string[] = [];
	for (let repository of raw) {
		if (!repos.includes(repository[repoURLKey])) {
			repos.push(repository[repoURLKey]);
		}
	}
	return repos;
};

const fetchRepos = async () => {
	let [parcility, canister, spartacus] = await Promise.all(lists.map((l) => fetchList(l)));
	let repos: string[] = [...parcility, ...canister, ...spartacus];
	return [...new Set(repos)];
};

let validateRepo = async (repo: string) => {
	let url = new URL(repo);
	url.pathname = join(url.pathname, 'Release');
	let raw = await request(url.toString(), 'text');

	if (!raw.includes('Origin:')) throw 404;
	return repo;
};

const validateRepos = async (repos: string[]) => {
	let chunks: string[][] = [];
	for (let i = 0; i < repos.length; i += 200) {
		chunks.push(repos.slice(i, i + 200));
	}

	let validRepos: string[] = [];
	for await (let chunk of chunks) {
		console.log(`validating ${chunk.length} repos`);
		let settled = await Promise.allSettled(chunk.map(async (r) => validateRepo(r)));
		let validated = settled.filter((s) => s.status === 'fulfilled').map((s) => s.status === 'fulfilled' && s.value);
		validRepos.push(...validated);
		console.log(`validated ${validated.length} repos`);
	}
	return validRepos;
};

(async () => {
	console.log('Fetching repos...');
	console.time('get repos');
	let raw = await fetchRepos();
	console.timeEnd('get repos');
	console.log(`Found ${raw.length} repos`);
	console.time('validate repos');
	let repos = await validateRepos(raw);
	console.timeEnd('validate repos');
	console.log(`Found ${repos.length} valid repos`);
	await writeFile('./repos.txt', repos.join('\n'), { encoding: 'utf-8' });
	console.log('Validated repos were written out to repos.txt!');
})();
