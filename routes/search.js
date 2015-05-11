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
var DBresults = db.collection('results');
var DBcaching = db.collection('caching');

db.on('error',function(err) {
    console.log('database error', err);
});

// CONSTANTS --------------------------------------------------

var CACHING = true;
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

router.get('/write', function(req, res, next) {
	var query;
	if (!(_.isEmpty(req.query))){
		goGetter(req.query, function(exists, docs){
			if (exists){
				res.send(docs)
			} else {
				console.log(docs)
				var output = JSON.stringify({
					"Headline": "ERROR",
					"Body": docs
				})
				res.send(output)
			}
		})
	} else {
		res.send("No query.")
	}
});

// router.get('/totals', function(req, res, next) {
// 	console.log(req.query)
// 	getTotals(req.query,function(array){
// 		console.log("wowoooooo")
// 		var output = {
// 			"array": array
// 		}
// 		res.send(output)
// 	})
// });

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

function goGetter(query, cb){
	// Just queries separate API written in Go...
	url = "http://127.0.0.1:8080/write?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			cb(false, err)
		} else {
			cb(true, bod)
		}
	})
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
			console.log("got here")
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

function tallyWords(results, questions){
	var tally = {} 
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
