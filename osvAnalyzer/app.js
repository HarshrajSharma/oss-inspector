const axios = require('axios');
const cvss = require('@neuralegion/cvss');

// const postData = { "package": { "purl": "pkg:pypi/django@1.11.1" } }
const postData = { "package": { "purl": process.argv[2] } }

let vulnsCounter = 0;
let osvScore = 0;


const finalData = {
    "score": 0,
    "vulns": []
};


axios.post('https://api.osv.dev/v1/query', postData)
    .then((response) => {

        if (response.data.vulns === undefined) {
            console.log('Not enough data to calculate score!');

        } else {
            response.data.vulns.forEach(element => {
                vulnsCounter++;

                if (element.severity === undefined) {
                    console.log(vulnsCounter, 'OMKAY');
                    osvScore = osvScore + 4;
                } else {
                    console.log(vulnsCounter, element.severity[0].score);
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

    })
    .then(() => {
        finalData.score = osvScore / vulnsCounter;

        console.log(finalData);
    })
    .catch((error) => {
        console.log(error);
    })