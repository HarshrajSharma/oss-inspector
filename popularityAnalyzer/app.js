const axios = require('axios');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
require('dotenv').config();



module.exports = function popularityAnalyzer() {



    let twitterScore = 0;
    let hackerScore = 0;

    let finalScore = 0;
    const Bearer_Token = process.env.Bearer_Token;

    let twitterCounter = 0;
    let hackerCounter = 0;

    const queryString = process.argv[2];
    console.log(queryString);

    console.log('Fetching data .....');

    axios.get(`https://api.twitter.com/2/tweets/search/recent?query=${queryString}`, {
        headers: {
            Authorization: `Bearer ${Bearer_Token}`
        }
    })
        .then((response) => {
            // console.log(response.data)
            console.log('Analyzing data .....');
            response.data.data.forEach((element) => {
                let currentTwitterScore = sentiment.analyze(element.text).score;
                twitterScore = twitterScore + currentTwitterScore;
                twitterCounter++;

            })

        }).then(() => {

            axios.get(`https://hn.algolia.com/api/v1/search_by_date?query=${queryString}&tags=story`)
                .then((response) => {
                    response.data.hits.forEach((element) => {

                        let currentHackerScore = sentiment.analyze(element.title).score;
                        hackerScore = hackerScore + currentHackerScore;
                        hackerCounter++;
                    })
                })
                .then(() => {
                    console.log('Twitter Score: ', twitterScore / twitterCounter);
                    console.log('Hacker Score: ', hackerScore / hackerCounter);
                })
                .catch((error) => {
                    console.log(error);
                })
        })

        .catch((err) => {
            console.log(err);
        })
}