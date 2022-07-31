require('dotenv').config();

const { initCredibilityChecker } = require('./credibility');

initCredibilityChecker({
	auth: process.env.GITHUB_PERSONAL_TOKEN
})
.then(async ({getGHRepoOverallReport}) => {
	console.log("Octokit Initialised");
	// const repo = await getGHRepo('https://github.com/meshery/meshery');
	const report = await getGHRepoOverallReport('https://github.com/facebook/react');
	console.log(report);
});
