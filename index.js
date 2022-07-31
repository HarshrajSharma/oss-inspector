require('dotenv').config();
const credibility = require('./credibility');
const osvAnalyzer = require('./osvAnalyzer');
const popularityAnalyzer = require('./popularityAnalyzer');

//osvAnalyzer.analyzeOsv('pkg:pypi/django@1.11.1').then(console.log)
popularityAnalyzer.analyzePopularity({
	twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
	query: "django"
})