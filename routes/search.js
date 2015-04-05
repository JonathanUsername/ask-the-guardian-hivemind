var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var apikey = require ('../keys.private.json')
var _ = require ('underscore')
var config = require('../config.json')

router.get('/', function(req, res, next) {
	var query = "politics";
	console.log(req.query);
	if (!(_.isEmpty(req.query))){
		query = req.query;
		guardianSearch(query, function(results){
			res.send(results);
		})
	} else {
		res.send("No query.")
	}
});

function guardianSearch(query,cb){
	query["api-key"] = apikey.key
	query["page-size"] = 200
	var url = "http://content.guardianapis.com/search?" + querystring.stringify(query)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			var data = JSON.parse(bod);
			var results = data.response.results;
			var tally = {} 
			var twodarr = [] 
			for (var i in results){
			    var arr = results[i].webTitle.split(' ')
			    for (var ind in arr){
			        var word = arr[ind]
			        word = word.replace(/’s/g, '')
			        word = word.replace(/([^a-z]+)/gi, '')
			        word = word.toLowerCase()
			        if (tally[word]){
			            tally[word] += config.stepSize
			        } else {
			            tally[word] = config.minSize
			        }
			    }
			}
			for (var word in tally){
				if (config.filter.indexOf(word) == -1 && word.length > 1){
				    twodarr.push([word,tally[word]])
				}
			}
			cb(twodarr)
		}
	})
}

module.exports = router;
