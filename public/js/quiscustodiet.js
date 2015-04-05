$(document).ready(function(){
	var screenh = $("body").outerHeight(),
		navh = $("nav.navbar").outerHeight(),
		canvh = screenh - navh,
		canvas = document.getElementById('cloudCanvas');
	$("#goSearch").click(function(){
		var qs = "?section=" + $("#section").val()
		$.ajax({
			url:"/search" + qs
		}).done(function(data){
			console.log(data)
			WordCloud(canvas, {
				list: data,
				fontFamily: "BreeSerif",
				gridSize:15
			})
		}).fail(function(err){
			alert(err)
		})
	})

	canvas.height = canvh
	canvas.width = window.innerWidth

})



