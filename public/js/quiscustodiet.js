$(document).ready(function(){
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
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth;
	$('.datepicker').datepicker()

	canvas.height = canvh
	canvas.width = window.innerWidth

	function searchIt(params){
		var qs, question, section, date;
		var params_for_sharing = encodeURIComponent(JSON.stringify(params))
		window.location.hash = params_for_sharing
		$(".fb-like").attr("data-href", window.location.href)
		$("a.share-url").attr("href", window.location.href).text(window.location.href)
		// Section cannot be left empty
		$("#section").val() == "all" ? delete params.section : false;
		qs = "?" + $.param(params)
		$.ajax({
			url:"/search" + qs
		}).done(function(data){
			console.log(data.array)
			if (data.array.length == 0){
				alert("No results!")
			} else {
				// Resize words according to window width
	    		data.array.forEach(function(i){
	    			i[1] = i[1] * Math.max(1, windoww / 700) 
	    		})
	    		WordCloud(canvas, {
	    			list: data.array,
	    			fontFamily: "BreeSerif",
	    			minSize: 10,
	    			gridSize:5 + Math.max(1, windoww / 700),
	    			click: function(item, dimension, event){
	    				fetchArticles(item, dimension, event, params)
	    			}
	    		})
	    	}
		}).fail(function(jqXHR,textStatus,errorThrown){
			console.log(jqXHR,textStatus,errorThrown)
			alert(textStatus,errorThrown,"Error connecting to server")
		})
	}

	// Get search query from hash.
	if (window.location.hash.length > 0){
		try {
			var url_query = decodeURIComponent(window.location.hash).replace(/^#/, "")
			var objectified = JSON.parse(url_query)
			if (typeof(objectified) === "object"){
				console.log(objectified, url_query)
				searchIt(objectified)
			} else {
				console.log("Hash is not a valid object.")
				window.location.hash = ""
			}
		} catch(e) {
			console.log("Oops. That's not a valid hash.")
			window.location.hash = ""
		}
	}

})


function fetchArticles(item,dimension,event,params){
	console.log(item,dimension,event)
	var word = item[0], 
		query = {},
		qs;
	console.log(params)
	query.filter = params
	query.word = word
	qs = "?" + $.param(query)
	console.log(qs)
	$.ajax({
		url:"/search/articles" + qs
	}).done(function(data){
		displayArticles(data)
	})
}

function displayArticles(data){
	console.log(data)
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


function getParams(){
	params = {
		"q": '"' + $("#question").val().toLowerCase() + '"',
		"section": $("#section").val(),
		"to-date": $("#to-date").val()
	}
	$("#section").val() == "all" ? delete params.section : false;
	console.log(params)
	return params
}
