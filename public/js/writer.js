$(document).ready(function(){
	// jQuery stuff, click handlers etc.
	$('#question').keyup(function(e){
	    if(e.keyCode == 13){
	    	searchIt(getParams());
	    }
	})
	$("#question").on("click", function(){
		$(".start_box").slideDown()
	})
	$("#openOptions").click(function(){
		icon = $("i.fa", this);
		icon.toggleClass("fa-angle-down");
		icon.toggleClass("fa-angle-up");
		$(".optional").toggleClass("closed");
	})
	$("#openInfo").click(function(){
		$(".info-box").show();
	})
	$("#closeInfo").click(function(){
		$(".info-box").hide();
	})
	$("#openShare").click(function(){
		$(".share-box").show();
	})
	$("#closeShare").click(function(){
		$(".share-box").hide();
	})
	$("#search").click(function(){
		searchIt(getParams());
	})
	$('.datepicker').datepicker();

	var grauniad_interval = 30000;
	// Start loop
	switchTitle(grauniad_interval)
	getHash()
})


// Functions --------------------------------------------------------------------


function searchIt(params){
	window.location.hash = "";
	var qs = "?" + $.param(params);
	$(".start_box").slideUp()
	$(".article_space").children().empty()
	$(".spinner").show()
	$.ajax({
		url:"/search/write" + qs
	}).done(function(data){
		var json = JSON.parse(data)
		var article = json.article
		// var body = cleanBody(data.Body)
		$(".spinner").hide()
		$(".article_space .headline").html(article.Headline)
		$(".article_space .trailtext").html(article.Trailtext)
		$(".article_space .main").html(article.Main)
		$(".article_space .body").html(article.Body)
		preparePage(json.cache);
	})
}

function getHash(){
	if (window.location.hash){
		var params = getParams()
		params.cache = window.location.hash.replace("#","")
		searchIt(params)
	}
}

// need to do this before it comes, I think
function cleanBody(str){
	var tags = ["a", "ul", "li", "strong"]
	for (var i in tags){
	    var rx = new RegExp("<" + tags[i] + "[^>]\+>", 'g')
		str = str.replace(rx, "")
	}
	return str
}

function getParams(){
	params = {
		"q": $("#question").val().toLowerCase(),
		"pl": $("#pl").val(),
		"wl": "500"
	}
	return params
}

function preparePage(cache){
	window.location.hash = cache;
	$("a.share-url").attr("href", window.location.href).text(window.location.href)
}


// Just for fun
function switchTitle(grauniad_interval){
	function timeoutSwitch(from,to,time,cb){
		window.setTimeout(function(){
			title.text(title.text().replace(from,to))
			cb(grauniad_interval)
		},time)
	}
	var title = $(".title h1:nth-child(2)");
	timeoutSwitch("Guardian", "Grauniad", grauniad_interval,function(grauniad_interval){
		timeoutSwitch("Grauniad","Guardian",5000,switchTitle)
	})
}
