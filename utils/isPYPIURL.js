
const isPYPIURL = function(url){
	const url1 = new URL(url);
	return url1.hostname.toLowerCase() === 'pypi.org'
}

module.exports = {
	isPYPIURL
}
