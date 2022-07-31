
const isGithubURL = function(url){
	const url1 = new URL(url);
	return url1.hostname.toLowerCase() === 'www.github.com' || url1.hostname.toLowerCase() === 'github.org'
}

module.exports = {
	isGithubURL
}
