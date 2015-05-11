var express = require('express');
var router = express.Router();
var _ = require ('underscore');
var all_words = require ('../words.private.json');

/* GET home page. */

router.get('/', function(req, res) {
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('index', { title: "Let's Ask The Guardian Hivemind", today: today, sharing: false });
});

router.get('/writer', function(req, res) {
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('writer', { title: "Let's Write The Guardian Hivemind", today: today, sharing: false });
});

router.get('/share', function(req, res) {
	console.log(req.query);
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('index', { title: "Let's Ask The Guardian Hivemind", today: today, sharing: true });
});

router.get('/total-searches', function(req, res) {
  	res.render('total-searches', { title: "Hivemind Searches" });
});

router.get('/totality', function(req, res) {
  	res.send(all_words);
});

module.exports = router;
