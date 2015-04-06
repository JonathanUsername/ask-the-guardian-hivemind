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
	    	qs = "?" + $.param(params)
	    	$.ajax({
	    		url:"/search" + qs
	    	}).done(function(data){
	    		data.forEach(function(i){
	    			i[1] = i[1] * Math.max(1, windoww / 700) 
	    		})
	    		WordCloud(canvas, {
	    			list: data,
	    			fontFamily: "BreeSerif",
	    			minSize: 10,
	    			gridSize:5 + Math.max(1, windoww / 700)
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
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth;
	$('.datepicker').datepicker()

	canvas.height = canvh
	canvas.width = window.innerWidth

})



