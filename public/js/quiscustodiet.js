$(document).ready(function(){
	$('#question').keyup(function(e){
	    if(e.keyCode == 13){
	    	var params, qs, question, section, date;
	    	// Guardian API prefers URI encoding to jQuery's params default encoding.
	    	params = {
	    		"q": encodeURI($("#question").val().toLowerCase()),
	    		"section": $("#section").val(),
	    		"to-date": $("#to-date").val()
	    	}
	    	// Section cannot be left empty
	    	$("#section").val() == "all" ? delete params.section : false;
	    	qs = "?" + $.param(params)
	    	$.ajax({
	    		url:"/search" + qs
	    	}).done(function(data){
	    		console.log(data.array)
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
	    	}).fail(function(jqXHR,textStatus,errorThrown){
	    		console.log(jqXHR,textStatus,errorThrown)
	    		alert(textStatus,errorThrown,"Error connecting to server")
	    	})
	    }
	})
	$("#openOptions").click(function(){
		$(".optional").toggleClass("closed")
	})
	$("#closeArticles").click(function(){
		$(".articles").hide();
	})
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth;
	$('.datepicker').datepicker()

	canvas.height = canvh
	canvas.width = window.innerWidth

})


function fetchArticles(item,dimension,event,params){
	console.log(item,dimension,event)
	var word = item[0], 
		query = {};
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
	console.log(data)
	var box = $(".article-box")
	var boxbits = $(".articles")
	boxbits.hide()
	box.empty()
	boxbits.show()
	box.append("<ul>")
	for (var i in data){
		var result = data[i]
		box.append("<li><a href=" + result.webUrl + ">" + result.webTitle + "</a></li>")
	}
	box.append("</ul>")
}


