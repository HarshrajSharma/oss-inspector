const { isPYPIURL } = require('./utils/isPYPIURL');
const { parsePYPIURL } = require('./utils/parsePYPIURL');

require('dotenv').config();

// const { initCredibilityChecker } = require('./credibility');

// initCredibilityChecker({
// 	auth: process.env.GITHUB_PERSONAL_TOKEN
// })
// .then(async ({getGHRepoOverallReport}) => {
// 	console.log("Octokit Initialised");
// 	// const repo = await getGHRepo('https://github.com/meshery/meshery');
// 	const report = await getGHRepoOverallReport('https://github.com/facebook/react');
// 	console.log(report);
// });

parsePYPIURL('https://pypi.org/project/Django/').then(console.log)
console.log(isPYPIURL('https://pypi.org/project/Django/'))