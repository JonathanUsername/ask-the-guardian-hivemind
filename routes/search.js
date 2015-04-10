var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var _ = require ('underscore')
var apikey = require ('../keys.private.json')
var config = require('../config.json')

// DATABASE
// db name : guardian
// collections : queries
var mongojs = require('mongojs');
var db = mongojs('guardian');
var DBqueries = db.collection('queries');
var DBresults = db.collection('results');
var DBcaching = db.collection('caching');

db.on('error',function(err) {
    console.log('database error', err);
});

// CONSTANTS
var CACHING = true;
var CACHING_RESULTS = true;
// Delete records after a week
var CACHING_TTL = 604800;
// Maximum records to request from API
var PAGE_SIZE = 200
// search in the body, not just the headlines
var BODYSEARCH = false;


router.get('/', function(req, res, next) {
	var query;
	console.log(req.query);
	if (!(_.isEmpty(req.query))){
		query = req.query;
		if (CACHING){
			checkCache(query, function(exists, cache){
				if (exists){
					var output = {
						"array": cache.array
					}
					res.send(output)
				} else {
				 	guardianSearch(query, function(output){
				 		res.send(output);
				 	})
				}
			})
		} else {
			guardianSearch(query, function(data){
				res.send(data);
			})
		}
	} else {
		res.send("No query.")
	}
});

router.get('/articles', function(req, res, next) {
	var query;
	if (!(_.isEmpty(req.query))){
		getArticles(req.query,function(exists, docs){
			if (exists){
				res.send(docs)
			} else {
				res.send("No dice.")
			}
		})
	} else {
		res.send("No query.")
	}
});

function guardianSearch(query,cb){
	var url, questions;
	query["api-key"] = apikey.key
	query["show-fields"] = "headline"
	if (BODYSEARCH){
		query["show-fields"] = "body,headline"
	}
	console.log(query["q"])
	// decodeURI to replace %20 with a space.
	questions = decodeURIComponent(query["q"]).split(" ")
	for (var i in questions){
		questions[i] = questions[i].replace(/([^a-z]+)/gi, '')
	}
	query["page-size"] = PAGE_SIZE
	url = "http://content.guardianapis.com/search?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			var data = JSON.parse(bod);
			var results = data.response.results;
			var tally = {} 
			var twodarr = [] 
			for (var i in results){
				var fields = results[i].fields
				for (var i in fields){
					// To catch searching through body and headlines
					var text = fields[i]
				    var arr = text.split(' ')
				    for (var ind in arr){
				        // Discard possessives, numbers and uppercase.
				        var word = arr[ind];
				        word = word.replace(/'s/g, '')
				        word = word.replace(/’s/g, '')
				        word = word.replace(/([^a-z]+)/gi, '')
				        word = word.toLowerCase()
				        // If it's not one of the questions.
				        if (questions.indexOf(word) == -1){
				        	// Increment the tally.
					        if (tally[word]){
					            tally[word] += config.stepSize
					        } else {
					            tally[word] = config.minSize
					        }
				        }
				    }
				}
			}
			for (var word in tally){
				if (config.filter.indexOf(word) == -1 && word.length > 1){
				    twodarr.push([word,tally[word]])
				}
			}
			output = {
				"array": twodarr
			}
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

function checkCache(query, cb){
	DBqueries.find(query, function(err, docs) {
	    if (docs.length == 0){
	    	console.log("Record not in cache.")
	    	cb(false)
	    } else { 
	    	console.log("Record exists in cache.")
	    	cb(true, docs[0])
	    }
	});
}

function updateCache(query, cb){
	DBqueries.insert(query, function() {
	    console.log("Updated queries.")
	    cb()
	});
}

function getArticles(query, cb){
	// This won't work for bodysearch
	DBqueries.find(query.filter, function(err, docs) {
	    if (docs.length == 0){
	    	console.log("Record not in cache.")
	    	cb(false)
	    } else { 
	    	console.log("Record exists in cache.")
	    	var results = docs[0].results;
    		console.log(query.filter)
	    	var output = []
	    	for (var i in results){
	    		var headline = results[i].fields.headline
	    		var re = new RegExp(query.word,"i");
	    		// console.log(headline)
	    		if (headline.search(re) != -1){
	    			output.push(results[i])
	    		}
	    	}
	    	cb(true, output)
	    }
	});
}


module.exports = router;
