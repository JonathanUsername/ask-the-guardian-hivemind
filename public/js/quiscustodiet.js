$(document).ready(function(){
	// jQuery stuff, click handlers etc.
	$('#question').keyup(function(e){
	    if(e.keyCode == 13){
	    	searchIt(getParams())
	    }
	})
	$("#openOptions").click(function(){
		icon = $("i.fa", this)
		icon.toggleClass("fa-angle-down")
		icon.toggleClass("fa-angle-up")
		$(".optional").toggleClass("closed")

	})
	$("#closeArticles").click(function(){
		$(".articles").hide();
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
		searchIt(getParams())
	})
	$("#totals").click(function(){
		fetchTotals()
	})
	$('.datepicker').datepicker()

	// Context
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth,
		grauniad_interval = 30000; // in ms

	// First resize
	resizeCanvas()

	// Get search query from hash.
	checkHash(window.location.hash)

	// Start loop
	switchTitle(grauniad_interval)
})


// Functions --------------------------------------------------------------------

function displayCloud(array, clickHandle, params, windoww, canvas){
	// Resize words according to window width
	array.forEach(function(i){
		i[1] = i[1] * Math.max(1, windoww / 700) 
	})
	WordCloud(canvas, {
		list: array,
		fontFamily: "BreeSerif",
		minSize: 10,
		gridSize:5 + Math.max(1, windoww / 700),
		click: function(item,dimension,event){
			clickHandle(item,dimension,event,params)
		}
	})
}

function resizeCanvas(){
	var screenh = $(window).outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas');

	canvas.height = canvh
	canvas.width = window.innerWidth
}

function fetchArticles(item,dimension,event,params){
	var word = item[0], 
		query = {},
		qs;
	query.filter = params
	query.word = word
	qs = "?" + $.param(query)
	$.ajax({
		url:"/search/articles" + qs
	}).done(function(data){
		displayArticles(data)
	})
}

function displayArticles(data){
	var box = $(".articles.article-box")
	var boxbits = $(".articles")
	boxbits.hide()
	box.empty()
	boxbits.show()
	box.append("<ul>")
	for (var i in data){
		var result = data[i]
		var date = new Date(result.webPublicationDate)
		box.append("<div class='result'><p>" + date.toLocaleString() + " - " + result.sectionName + "</p><a href=" + result.webUrl + ">" + result.webTitle + "</a></div>")
	}
	box.append("</ul>")
}

function fetchTotals(){
	$.ajax({
		url:"/search/totals"
	}).done(function(data){
		var arr = data.array
		displayCloud(arr, function(item,dimension,event,params){
			// return count
			for (var i in arr){
				arr[i][0] == item[0] ? alert("Query: "+item[0]+"\nFont size: "+arr[i][1]) : false
			}
		}, {}, windoww, canvas)
	})
}

function checkHash(hash){
	if (hash.length > 0){
		try {
			var url_query = decodeURIComponent(hash).replace(/^#/, "")
			var objectified = JSON.parse(url_query)
			if (typeof(objectified) === "object"){
				var question = objectified["q"].replace(/"/g,'')
				$('#question').val(question)
				searchIt(objectified)
			} else {
				console.log("Hash is not a valid object.")
				window.location.hash = ""
			}
		} catch(e) {
			console.log("Oops. That's not a valid hash.", e)
			window.location.hash = ""
		}
	} else {
		$(".start_box").show()
	}
}

function getParams(){
	params = {
		"q": '"' + $("#question").val().toLowerCase() + '"',
		"section": $("#section").val(),
		"to-date": $("#to-date").val()
	}
	$("#section").val() == "all" ? delete params.section : false;
	return params
}

function searchIt(params){
	var qs, question, section, date;
	var params_for_sharing = encodeURIComponent(JSON.stringify(params)),
		windoww = window.innerWidth,
		canvas = document.getElementById('cloudCanvas');
	window.location.hash = params_for_sharing
	$("#question").blur()
	$(".start_box").hide()
	$(".fb-like").attr("data-href", window.location.href)
	$("a.share-url").attr("href", window.location.href).text(window.location.href)
	// Section cannot be left empty
	$("#section").val() == "all" ? delete params.section : false;
	qs = "?" + $.param(params)
	$.ajax({
		url:"/search" + qs
	}).done(function(data){
		resizeCanvas()
		if (data.array.length == 0){
			alert("No results!")
		} else {
			displayCloud(data.array, fetchArticles, params, windoww, canvas)
    	}
	}).fail(function(jqXHR,textStatus,errorThrown){
		console.log(jqXHR,textStatus,errorThrown)
		alert(textStatus,errorThrown,"Error connecting to server")
	})
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
