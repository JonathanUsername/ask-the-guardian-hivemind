var express = require('express');
var router = express.Router();
var _ = require ('underscore')

/* GET home page. */

router.get('/', function(req, res) {
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('index', { title: "Let's Ask The Guardian Hivemind", today: today, sharing: false });
});

router.get('/share', function(req, res) {
	console.log(req.query);
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('index', { title: "Let's Ask The Guardian Hivemind", today: today, sharing: true });
});


module.exports = router;
