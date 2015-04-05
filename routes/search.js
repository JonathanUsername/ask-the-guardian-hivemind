var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var apikey = require ('../keys.private.json')
var _ = require ('underscore')

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
			        word = word.replace(/([^a-z0-9]+)/gi, '')
			        word = word.toLowerCase()
			        if (tally[word]){
			            tally[word] += 1
			        } else {
			            tally[word] = 1
			        }
			    }
			}
			for (var key in tally){
			    twodarr.push([key,tally[key]])
			}
			cb(twodarr)
		}
	})
}

module.exports = router;
