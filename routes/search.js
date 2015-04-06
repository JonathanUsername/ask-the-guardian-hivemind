var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var _ = require ('underscore')
var apikey = require ('../keys.private.json')
var config = require('../config.json')

var data = {
            "webTitle": "From laughs to stats: the fresh digital approach to election coverage",
            "webPublicationDate": "2015-04-05T17:04:00Z",
            "sectionId": "media",
            "id": "media/2015/apr/05/engage-electorate-online-audiences",
            "webUrl": "http://www.theguardian.com/media/2015/apr/05/engage-electorate-online-audiences",
            "apiUrl": "http://content.guardianapis.com/media/2015/apr/05/engage-electorate-online-audiences",
            "sectionName": "Media"
        }


var BODYSEARCH = false;
var CACHING = true;
var CACHING_RESULTS = false;
// delete records after a week
var CACHING_TTL = 604800;

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


router.get('/', function(req, res, next) {
	var query;
	console.log(req.query);
	if (!(_.isEmpty(req.query))){
		query = req.query;
		if (CACHING){
			checkCache(query, function(exists, cache){
				if (exists){
					res.send(cache.array)
				} else {
				 	guardianSearch(query, function(array){
				 		res.send(array);
				 	})
				}
			})
		} else {
			guardianSearch(query, function(array){
				res.send(array);
			})
		}
	} else {
		res.send("No query.")
	}
});

function guardianSearch(query,cb){
	var url;
	query["api-key"] = apikey.key
	query["show-fields"] = "headline"
	if (BODYSEARCH){
		query["show-fields"] = "body,headline"
	}
	query["page-size"] = 200
	url = "http://content.guardianapis.com/search?" + querystring.stringify(query)
	console.log(url)
	request(url, function(err,res,bod){
		if (err){
			return err
		} else {
			var data = JSON.parse(bod);
			var results = data.response.results;
			console.log(data.response)
			var tally = {} 
			var twodarr = [] 
			for (var i in results){
				var fields = results[i].fields
				for (var i in fields){
					var text = fields[i]
				    var arr = text.split(' ')
				    for (var ind in arr){
				        var word = arr[ind];
				        word = word.replace(/'s/g, '')
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
			}
			for (var word in tally){
				if (config.filter.indexOf(word) == -1 && word.length > 1){
				    twodarr.push([word,tally[word]])
				}
			}
			cb(twodarr)
			if (CACHING){
				query.array = twodarr
				if (CACHING_RESULTS){
					query.results = results
				}
				updateCache(query, results, function(){
					console.log("Finished updating cache.")
				})
			}
		}
	})
}

	// DBqueries.find(function(err, docs) {
	//     if (docs.length == 0){
	//     	DBqueries.insert(data)
	//     } else { 
	//     	var id = docs[0]._id
	//     	DBqueries.findAndModify({
	//     	    query: {_id : id},
	//     	    update: { $set: { sectionName:'IncreMENTAL' } },
	//     	    new: true
	//     	}, function(err, doc, lastErrorObject) {
	//     	    console.log(doc)
	//     	});
	//     }
	// });

function checkCache(query, cb){
	DBqueries.find({ "q" : query["q"] }, function(err, docs) {
	    if (docs.length == 0){
	    	"Record not in cache."
	    	cb(false)
	    } else { 
	    	"Record exists in cache."
	    	cb(true, docs[0])
	    }
	});
}

function updateCache(query, results, cb){
	DBqueries.insert(query, function() {
	    console.log("Updated queries.")
	    cb()
	});
}

module.exports = router;
