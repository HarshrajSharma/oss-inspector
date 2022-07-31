const { default: axios } = require("axios");

const parseNpmURL = async function (url) {



    const urlNew = new URL(url);
    const [, , packageName] = urlNew.pathname.split('/');

    const response =  (await axios.get(`https://api.npms.io/v2/package/${packageName}`)).data;


    const githubURL = response.collected.metadata.links.repository;
    const purl = `pkg:npm/${packageName}@${response.collected.metadata.version}`


    return {

        githubURL: githubURL,
        purl: purl,
        package: packageName

    }
}

module.exports ={
    parseNpmURL: parseNpmURL
}
