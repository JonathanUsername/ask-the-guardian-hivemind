var express = require('express');
var querystring = require('querystring');
var router = express.Router();
var request = require('request');
var apikey = require ('../keys.private.json')
var _ = require ('underscore')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/', function(req, res, next) {
	var query = "politics";
	console.log(req.query);
	if (!(_.isEmpty(req.query))){
		query = req.query;
		results = guardianSearch(query)
		res.send(results);
	} else {
		res.send("No query.")
	}
});

function guardianSearch(query){
	query["api-key"] = apikey.key
	var url = "http://content.guardianapis.com/search?" + querystring.stringify(query)
	request(url, function(err,res,bod){
		console.log(err,res,bod)
	})
}

module.exports = router;
