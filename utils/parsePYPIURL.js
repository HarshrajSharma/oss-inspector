const { default: axios } = require("axios");

const parsePYPIURL = async function(pypi_url){
	const url1 = new URL(pypi_url);
	const [,,package] = url1.pathname.split('/');
	const packageData = (await axios.get(`https://pypi.org/pypi/${package}/json`)).data;
	const {
		version,
		project_urls
	} = packageData.info;
	
	const githubURL = project_urls.Source;
	const purl = `pkg:pypi/${package}@${version}`

	return {
		githubURL,
		purl,
		package
	}

}

module.exports = {
	parsePYPIURL
}
