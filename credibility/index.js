const { createAppAuth } = require('@octokit/auth-app');
const { writeFileSync } = require('fs');
const {Octokit} = require('octokit')
const URL = require('url').URL;

let octokit =  null;

async function getGHRepo(url){
	const url1 = new URL(url);
	const path = url1.pathname;
	console.log(path)
	const [,owner,repo] = path.split('/');
	const repoDetails = await octokit.request(`GET /repos/{owner}/{repo}`, {
		owner,
		repo
	})
	return repoDetails.data;
}

async function getStargazers(repoDetails){
	const stargazers = (await octokit.request(`GET ${repoDetails.stargazers_url}?per_page=100`)).data;
	return stargazers;
}
async function getStarScore(stargazers_count,stargazers){
	const countScore = Math.max(Math.log2(stargazers_count),-5);
	const stargazersScores = await Promise.all(stargazers.map(async (star_g) => await getUserBasicScore(star_g.login)));
	let sum = 0;
	stargazersScores.forEach(sg => {
		sum+= sg.score
	});
	const stargazerScore = sum / stargazers.length;
	// console.log(
	// 	{
	// 		score: countScore + stargazerScore,
	// 		report: {
	// 			countScore,
	// 			stargazerScore
	// 		}
	// 	}
	// )
	return {
			score: countScore + stargazerScore,
			report: {
				countScore,
				stargazerScore
			}
		};
}

async function getGHRepoStarReport(repoDetails){
	const starCount = repoDetails.stargazers_count;
	const stargazers = await getStargazers(repoDetails)
	const starScore = await getStarScore(starCount,stargazers);
	return starScore;
}

async function getGHRepoOwnerReport(repoDetails){
	const ownerTypeScore = repoDetails.owner.type === 'Organization' ? 10 : 0;
	let ownerScore = 0;
	if(repoDetails.owner.type === 'Organization'){
		ownerScore = (await getOrgBasicScore(repoDetails.owner.login)).score;
	} else {
		ownerScore = (await getUserBasicScore(repoDetails.owner.login)).score;
	}
	return {
		score: (ownerScore + ownerTypeScore),
		report: {
			ownerTypeScore,
			ownerScore
		}
	}
}

async function getGHRepoActivityScore(repoDetails){
	const events = [];
	let page = 1;
	let currentOldestActivityTime = new Date().getTime() - 1000;
	const thresholdTime = new Date().getTime() - 180 * 24 * 3600 * 1000; // 180 days
	while(page <= 3 && currentOldestActivityTime >= thresholdTime){
		const newEvents =  (await octokit.request(`GET /repos/{owner}/{repo}/events?per_page=100&page=${page}`,{
			repo: repoDetails.name,
			owner: repoDetails.owner.login
		})).data;
		newEvents.forEach(event =>{
			const currTime = new Date(event.created_at).getTime();
			if(currTime >= thresholdTime){
				events.push(event);
			}
			currentOldestActivityTime = currTime;
		})
		page++;
	}
	const activityRate = events.length / ( (new Date().getTime() - currentOldestActivityTime) / (24 * 3600 * 1000)); // activity per day
	const activityScore = (activityRate/(50000/365)) * 10 // 50000 activity in a year => 10 points,
														// assuming 50 contributers make 1000 activities in a year
	// console.log("Events: "+ events.length)
	// console.log("Last date: "+ new Date(currentOldestActivityTime));
	// console.log("Activity Rate: "+ activityRate);
	return activityScore;
}

async function getGHRepoContributorsScore(repoDetails){
	const contributors = (await octokit.request(`GET /repos/{owner}/{repo}/contributors?per_page=100`,{
		repo: repoDetails.name,
		owner: repoDetails.owner.login
	})).data
	.filter(c => c.type !== 'Bot');

	const contributorsScores = await Promise.all(contributors.map(async (c) => await getUserBasicScore(c.login)));
	let sum = 0;
	contributorsScores.forEach(c => {
		sum+= c.score
	});
	const contributorsScore = sum / contributors.length;
	return contributorsScore;
}

// org scores
async function getOrgActivityScore(org){
	const events = [];
	let page = 1;
	let currentOldestActivityTime = new Date().getTime() - 1000;
	const thresholdTime = new Date().getTime() - 180 * 24 * 3600 * 1000; // 180 days
	while(page <= 1 && currentOldestActivityTime >= thresholdTime){
		const newEvents =  (await octokit.request(`GET /orgs/{org}/events?per_page=100&page=${page}`,{
			org
		})).data;
		newEvents.forEach(event =>{
			const currTime = new Date(event.created_at).getTime();
			if(currTime >= thresholdTime){
				events.push(event);
			}
			currentOldestActivityTime = currTime;
		})
		page++;
	}
	const activityRate = events.length / ( (new Date().getTime() - currentOldestActivityTime) / (24 * 3600 * 1000)); // activity per day
	const activityScore = (activityRate/(50000/365)) * 10 // 50000 activity in a year => 10 points,
														// assuming 50 contributers make 1000 activities in a year
	// console.log("Events: "+ events.length)
	// console.log("Last date: "+ new Date(currentOldestActivityTime));
	// console.log("Activity Rate: "+ activityRate);
	return activityScore;
}

async function getOrgBasicScore(org){
	const currOrg = (await octokit.request(`GET /orgs/{org}`,{
		org
	})).data;
	const publicRepoScore = Math.max(Math.log(currOrg.public_repos) / Math.log(Math.pow(100,0.1)),-5);
	const years = (new Date().getTime() -  new Date(currOrg.created_at).getTime())/(365 * 24 * 3600 * 1000)
	const timeScore = years * 2;
	const verifiedScore = currOrg.is_verified ? 10 : 0; 
	const activityScore = await getOrgActivityScore(org);
	return {
		score: (publicRepoScore + timeScore + verifiedScore + activityScore) / 4,
		report: {
			publicRepoScore,
			timeScore,
			verifiedScore,
			activityScore
		}
	}
}


// User scores

async function getUserActivityScore(username){
	const events = [];
	let page = 1;
	let currentOldestActivityTime = new Date().getTime() - 1000;
	const thresholdTime = new Date().getTime() - 180 * 24 * 3600 * 1000; // 180 days
	while(page <= 3 && currentOldestActivityTime >= thresholdTime){
		const newEvents =  (await octokit.request(`GET /users/{username}/events/public?per_page=100&page=${page}`,{
			username
		})).data;
		newEvents.forEach(event =>{
			const currTime = new Date(event.created_at).getTime();
			if(currTime >= thresholdTime){
				events.push(event);
			}
			currentOldestActivityTime = currTime;
		})
		page++;
	}
	const activityRate = events.length / ( (new Date().getTime() - currentOldestActivityTime) / (24 * 3600 * 1000)); // activity per day
	const activityScore = (activityRate/(1000/365)) * 10 // 1000 activity in a year => 10 points
	// console.log("Events: "+ events.length)
	// console.log("Last date: "+ new Date(currentOldestActivityTime));
	// console.log("Activity Rate: "+ activityRate);
	return activityScore;
}

async function getUserBasicScore(username){
	const user = (await octokit.request(`GET /users/{username}`,{
		username
	})).data;
	const followersScore = Math.max(Math.log2(user.followers),-5);
	const publicRepoScore = Math.max(Math.log(user.public_repos) / Math.log(Math.pow(100,0.1)),-5);
	const years = (new Date().getTime() -  new Date(user.created_at).getTime())/(365 * 24 * 3600 * 1000)
	const timeScore = years * 2;
	
	const activityScore = await getUserActivityScore(username)
	
	return {
		score: (followersScore + publicRepoScore + timeScore + activityScore)/4,
		report: {
			followersScore,
			publicRepoScore,
			timeScore,
			activityScore
		}
	}
}

async function getGHRepoOverallReport(repo_url){
	console.log('Reading repo details for '+repo_url);
	const repo = await getGHRepo(repo_url);

	console.log('Getting Owner details for '+repo.full_name);
	const repoOwnerScore = await getGHRepoOwnerReport(repo);

	console.log('Getting star details for '+repo.full_name);
	const repoStarScore = await getGHRepoStarReport(repo);

	console.log('Getting activity details for '+repo.full_name);
	const repoActivityScore = await getGHRepoActivityScore(repo);

	console.log('Getting contributors details for '+repo.full_name);
	const repoContributorsScore = await getGHRepoContributorsScore(repo);
	console.log('Final report generated');
	const finalReport = {
		score: (repoOwnerScore.score + repoStarScore.score + repoActivityScore + repoContributorsScore ) / 4,
		repoOwnerScore,
		repoStarScore,
		repoActivityScore,
		repoContributorsScore
	}
	return finalReport;
}
const init = async (auth) => {
	octokit = new Octokit(auth);
	await octokit.rest.users.getAuthenticated();	
	return credibilityChecker;
}
const credibilityChecker = {
	initCredibilityChecker: init,
	octokit,
	getGHRepo,
	getUserBasicScore,
	getUserActivityScore,
	getOrgActivityScore,
	getOrgBasicScore,
	getGHRepoStarReport,
	getGHRepoOwnerReport,
	getGHRepoActivityScore,
	getGHRepoContributorsScore,
	getGHRepoOverallReport
}
module.exports = credibilityChecker;