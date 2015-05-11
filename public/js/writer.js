$(document).ready(function(){
	// jQuery stuff, click handlers etc.
	$('#question').keyup(function(e){
	    if(e.keyCode == 13){
	    	searchIt(getParams());
	    }
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
})


// Functions --------------------------------------------------------------------


function searchIt(params){
	qs = "?" + $.param(params)
	$.ajax({
		url:"/search/write" + qs
	}).done(function(data){
		data = JSON.parse(data)
		// var body = cleanBody(data.Body)
		$(".article_space .headline").html(data.Headline)
		$(".article_space .trailtext").html(data.Trailtext)
		$(".article_space .body").html(data.Body)
	})
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
