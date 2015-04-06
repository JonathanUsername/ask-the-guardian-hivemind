var express = require('express');
var router = express.Router();

/* GET home page. */

router.get('/', function(req, res) {
	var today = new Date()
	today = today.toISOString().split("T")[0]
  	res.render('index', { title: "Let's Ask The Guardian Hivemind", today: today });
});

module.exports = router;
