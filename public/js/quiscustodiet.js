$(document).ready(function(){
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth;
	$('.datepicker').datepicker()
	$("#goSearch").click(function(){
		var params, qs;
		params = {
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
				gridSize:5 + Math.max(1, windoww / 700)
			})
		}).fail(function(jqXHR,textStatus,errorThrown){
			console.log(jqXHR,textStatus,errorThrown)
			alert(textStatus,errorThrown,"Error connecting to server")
		})
	})

	canvas.height = canvh
	canvas.width = window.innerWidth

})



