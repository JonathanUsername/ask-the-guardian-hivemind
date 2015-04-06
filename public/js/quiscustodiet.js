$(document).ready(function(){
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas');
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
			console.log(data)
			WordCloud(canvas, {
				list: data,
				fontFamily: "BreeSerif",
				gridSize:15
			})
		}).fail(function(jqXHR,textStatus,errorThrown){
			console.log(jqXHR,textStatus,errorThrown)
			alert(textStatus,errorThrown,"Error connecting to server")
		})
	})

	canvas.height = canvh
	canvas.width = window.innerWidth

})



