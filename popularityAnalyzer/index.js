const axios = require('axios').default;
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

async function popularityAnalyzer({twitterAccessToken, query}) {
    let twitterScore = 0;
    let hackerScore = 0;

    const Bearer_Token = twitterAccessToken;

    let twitterCounter = 0;
    let hackerCounter = 0;

    const queryString = query;
    const responseTwitter = await axios.get(`https://api.twitter.com/2/tweets/search/recent?query=${queryString}`, {
        headers: {
            Authorization: `Bearer ${Bearer_Token}`
        }
    });
    responseTwitter.data.data.forEach((element) => {
        let currentTwitterScore = sentiment.analyze(element.text).score;
        twitterScore = twitterScore + currentTwitterScore;
        twitterCounter++;
    })

    const hnResponse = await axios.get(`https://hn.algolia.com/api/v1/search_by_date?query=${queryString}&tags=story`);
    hnResponse.data.hits.forEach((element) => {
        let currentHackerScore = sentiment.analyze(element.title).score;
        hackerScore = hackerScore + currentHackerScore;
        hackerCounter++;
    })
    //score range 0 -10
    hackerScore = hackerScore / hackerCounter +  5;
    twitterScore = twitterScore / twitterCounter + 5;
  
    return {
        score: (hackerScore + twitterScore) / 2,
        report: {
            hackerNewsScore: hackerScore,
            twitterScore
        }
    }
}


module.exports = {
    analyzePopularity: popularityAnalyzer
}