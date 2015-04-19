var search = require('./search.js')

nyt = new search.Searcher()

nyt.search = function(query,cb){
	var url, questions;
	query["api-key"] = apikey.nytkey
	// decodeURI to replace %20 with a space.
	questions = decodeURIComponent(query["q"]).split(" ")
	for (var i in questions){
		questions[i] = questions[i].replace(/([^a-z]+)/gi, '')
	}
	url = "http://api.nytimes.com/svc/search/v2/articlesearch.response-format?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			console.log(bod)
			var data = JSON.parse(bod),
				results = data.response.results,
				tally = tallyWords(results, questions),
				twodarr = buildArray(tally)
				output = {
					"array": twodarr
				};
			cb(output)
			if (CACHING){
				query.array = twodarr
				if (CACHING_RESULTS){
					query.results = results
				}
				updateCache(query, function(){
					console.log("Finished updating cache.")
				})
			}
		}
	})
}

module.exports = nyt;