const { default: axios } = require("axios");
const { isGithubURL } = require("./isGithubURL");

const parsePYPIURL = async function(pypi_url){
	const url1 = new URL(pypi_url);
	const [,,package] = url1.pathname.split('/');
	const packageData = (await axios.get(`https://pypi.org/pypi/${package}/json`)).data;
	const {
		project_urls,
	} = packageData.info;

	const githubURL = project_urls[
		Object.keys(project_urls).find(key => isGithubURL(project_urls[key]))
	];
	const purl = `pkg:pypi/${package}@${Object.keys(packageData.releases)[0]}`
	
	return {
		githubURL,
		purl,
		package
	}

}

module.exports = {
	parsePYPIURL
}
