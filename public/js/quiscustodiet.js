$(document).ready(function(){
	$("#goSearch").click(function(){
		var qs = "?section=" + $("#section").val()
		$.ajax({
			url:"/search" + qs
		}).done(function(data){
			console.log(data)
			WordCloud(document.getElementById('cloudCanvas'), {
				list: data
			})
		}).fail(function(err){
			alert(err)
		})
	})
})



