const axios = require('axios');
const cvss = require('@neuralegion/cvss');

async function osvAnalyzer(purl){
    const postData = { "package": { "purl": purl } }

    let vulnsCounter = 0;
    let osvScore = 0;


    const finalData = {
        "score": 0,
        "vulns": []
    };

    const response = await axios.post('https://api.osv.dev/v1/query', postData)

    if (response.data.vulns === undefined) {
        console.log('Not enough data from osv.dev to calculate score!');

    } else {
        response.data.vulns.forEach(element => {
            vulnsCounter++;

            if (element.severity === undefined) {
                osvScore = osvScore + 4;
            } else {
                osvScore = osvScore + cvss.calculateBaseScore(element.severity[0].score);
                const individualReport = {
                    "id": element.id,
                    "summary": element.summary,
                    "details": element.details,
                    "published": element.published,
                    "individualScore": cvss.calculateBaseScore(element.severity[0].score)
                }
                finalData.vulns.push(individualReport);

            }
        });
    }
    finalData.score = osvScore / vulnsCounter;
    return finalData;
}

module.exports = {
    analyzeOsv: osvAnalyzer
};