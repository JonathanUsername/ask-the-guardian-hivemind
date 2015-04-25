$(document).ready(function(){
	// Context
	var canvas = document.getElementById('cloudCanvas'),
		windoww = window.innerWidth;
	
	resizeCanvas()

	$.ajax({
		"url": "/totality"
	}).done(function(data){
		var array = data.arr.reverse()
		console.log(array)
		displayCloud(array, function(item){ 
			var count = parseInt(item[1] / (window.innerWidth / 700))
			alert(count + " total searches for the phrase '" + item[0] + "'") 
		}, null, windoww, canvas)
	})

})