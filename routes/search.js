var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var _ = require ('underscore')
var apikey = require ('../keys.private.json')
var config = require('../config.json')

// DATABASE ---------------------------------------------------
// db name : guardian
// collections : queries

var mongojs = require('mongojs');
var db = mongojs('guardian');
var DBqueries = db.collection('queries');
var DBnytqueries = db.collection('nytqueries');
var DBresults = db.collection('results');
var DBcaching = db.collection('caching');

db.on('error',function(err) {
    console.log('database error', err);
});

// CONSTANTS --------------------------------------------------

var CACHING = false;
var CACHING_RESULTS = true;
// Delete records after a week
var CACHING_TTL = 604800;
// Maximum records to request from API
var PAGE_SIZE = 200
// search in the body, not just the headlines
var BODYSEARCH = false;

// ROUTES -----------------------------------------------------

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
				 	guardianSearch(query, function(output, questions, fields){
				 		var twodarr = buildArray(tallyWords(output,questions, fields, false))
				 		var to_send = { 
				 			"array" : twodarr
				 		}
				 		res.send(to_send);
			 			query.array = twodarr
			 			if (CACHING_RESULTS){
			 				query.results = output
			 			}
			 			updateCache(query, function(){
			 				console.log("Finished updating cache.")
			 			})
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

router.get('/nyt', function(req, res, next) {
	console.log(req.query)
	combineQueries(req.query,function(output){
		console.log("wowoooooo", output)
		res.send(output)
	})
});

// CACHE --------------------------------------------------

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

// TOTALS --------------------------------------------------

function getTotals(query, cb){
	console.log("getting totals")
	var filter = {
	    "key": {
	        "q": true
	    },
	    "initial": {
	        "count": 0
	    },
	    "reduce": function(cur, result) {
	        if (cur.q != null){
				result.count++
	        }
	    }
	};
	DBqueries.group(filter, function(err,arr){
		console.log("got totals ",arr);
		var twodarr = [];
		for (var i in arr){
			console.log(arr[i])
			var word = arr[i].q,
				count =  arr[i].count;
			if(!_.isNull(word)) {
				var font_size = arr[i].count * config.stepSize + config.minSize;
				word = word.replace(/"/g,'')
				twodarr.push([word,font_size]);
			}
		}
		cb(twodarr);
	});
}

// ARTICLES ------------------------------------------------

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
	    		if (headline.search(re) != -1){
	    			output.push(results[i])
	    		}
	    	}
	    	cb(true, output)
	    }
	});
}

// API PARSING ---------------------------------------------

function guardianSearch(query,cb){
	var url, questions;
	query["api-key"] = apikey.key
	query["show-fields"] = "headline"
	query["page-size"] = PAGE_SIZE
	if (BODYSEARCH){
		query["show-fields"] = "body,headline"
	}
	if (askingForTotals(query["q"])){
		getTotals(query, function(array){
			var output = {
				"array": array
			}
			cb(output)
		})
		return
	}
	// decodeURI to replace %20 with a space.
	questions = decodeURIComponent(query["q"]).split(" ")
	for (var i in questions){
		questions[i] = questions[i].replace(/([^a-z]+)/gi, '')
	}
	url = "http://content.guardianapis.com/search?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			var data = JSON.parse(bod),
				results = data.response.results;
			cb(results, questions, "fields")
		}
	})
}

function nytSearch(query,cb){
	// nyt api only returns 10 results per page. Damn.
	var url, questions;
	query["api-key"] = apikey.nytkey;
	query["sort"] = 'newest';
	query["fq"] = 'source:("The New York Times") AND body:("' + query["q"] + '")'
	// query["fl"] = 'body,headline,web_url'	
	// decodeURI to replace %20 with a space.
	questions = decodeURIComponent(query["q"]).split(" ")
	for (var i in questions){
		questions[i] = questions[i].replace(/([^a-z]+)/gi, '')
	}
	url = "http://api.nytimes.com/svc/search/v2/articlesearch.json?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			console.log(JSON.parse(bod))
			var data = JSON.parse(bod),
				results = data.response.docs;
			cb(results, questions, "headline")
		}
	})
}

function combineQueries(query, cb){
	var returned = {}
	nytSearch(query,function(results,questions,fields){
		returned.nyt = tallyWords(results, questions, fields, true)
		if (returned.gua) {
			cb(compareTallies(returned))
		}
	})
	guardianSearch(query,function(results,questions,fields){
		returned.gua = tallyWords(results, questions, fields, true)
		if (returned.nyt) {
			cb(compareTallies(returned))
		}
	})
}

function compareTallies(obj){
	var gua = obj.gua,
		nyt = obj.nyt,
		out = {};
	for (var gkey in gua){
		var gval = gua[gkey];
		for (var nkey in nyt){
			var nval = nyt[nkey]
			// subtract one from the other, negative terms are NYT, positive are GUA
			try {
				(nkey == gkey) ? out[nkey] = nval - gval : false
			} catch(e) {
				debugger
			}
		}
	}
	return out
}

function tallyWords(results, questions, f, forCloud){
	var tally = {},
		step = 1,
		min = 0;
	if (forCloud){
		step = config.stepSize;
		min = config.minSize
	}
	for (var i in results){
		var fields = results[i][f]
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
			            tally[word] += step
			        } else {
			            tally[word] = min
			        }
		        }
		    }
		}
	}
	return tally
}

function buildArray(tally){
	var twodarr = [] 
	for (var word in tally){
		if (config.filter.indexOf(word) == -1 && word.length > 1){
		    twodarr.push([word,tally[word]])
		}
	}
	return twodarr
}

function askingForTotals(question){
	question = question.replace(/"/g,"")
	if (config.totals_keywords.indexOf(question) != -1){
		return true
	} else {
		return false
	}
}


module.exports = router;
