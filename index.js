require('dotenv').config();
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

const credibility = require('./credibility');
const { analyzeOsv } = require('./osvAnalyzer');
const osvAnalyzer = require('./osvAnalyzer');
const { analyzePopularity } = require('./popularityAnalyzer');
const popularityAnalyzer = require('./popularityAnalyzer');
const { isGithubURL } = require('./utils/isGithubURL');
const { isNPMURL } = require('./utils/isNPMURL');
const { isPYPIURL } = require('./utils/isPYPIURL');
const {parseNpmURL} = require('./utils/parseNpmURL');
const { parsePYPIURL } = require('./utils/parsePYPIURL');

//osvAnalyzer.analyzeOsv('pkg:pypi/django@1.11.1').then(console.log)
// popularityAnalyzer.analyzePopularity({
// 	twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
// 	query: "django"
// })

const runFullAnalyzer = async ({githubURL, package, purl}) => {
	console.log('Analyzing vulnerabilities...');
	const osvReport = await analyzeOsv(purl)
	
	console.log('Analyzing popularity...');
	const popularityReport = await analyzePopularity({
		twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN, 
		query: package
	});
	
	console.log('Analyzing repository credibility..');
	const credReport = await credibility.getGHRepoOverallReport(githubURL);
	console.log('Report generated!','\n\n');

	console.log('Vulnerability score:\nScore Range: [0, 10]');
	console.log(osvReport,'\n\n');
	
	console.log('Popularity score\nScore Range: [0, 10]');
	console.log(popularityReport,'\n\n');
	
	console.log('Credibility score\nScore >= 10 == very good\n Score ~ 5 == average');
	console.log(credReport, '\n\n')

	console.log('Final Score: '+(osvReport.score + popularityReport.score+ credReport.score));
}
const main = async () => {
	console.log('Welcome to OSS Inspector!!');
	console.log('We support security inspection using pypi & npm url.')
	readline.question(`URL of the package: `, async (url) => {
		readline.close();
		if(isPYPIURL(url)){
			const pypi = await parsePYPIURL(url);
			runFullAnalyzer(pypi)
		} else if(isNPMURL(url)) {
			const npm = await parseNpmURL(url);
			runFullAnalyzer(npm)
		} else  if(isGithubURL(url)){
			
		} else {
			console.log('Only pypi and npm packages support now.')
		}
	})
}

credibility
	.initCredibilityChecker({auth: process.env.GITHUB_PERSONAL_TOKEN})
	.then(main)
	.catch(console.error)