
const isNPMURL = function(url){
	const url1 = new URL(url);
	return url1.hostname.toLowerCase() === 'www.npmjs.com' || url1.hostname.toLowerCase() === 'npmjs.org'
}

module.exports = {
	isNPMURL
}
