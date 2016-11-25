//开始上课事件
$("#class_start").on("click",function(){

});
//课间休息事件
$("#class_break").on("click",function(){

});
$(document).ready(function($) {
	// 电子白板界面关闭	
	$("#close").click(function(event) {
		var result = confirm("是否保存电子白板内容？");
		if (result) {
			save();
		}
		$("#canvas_tools").css("display","none");
		$("#wbpage_parent").children(0).children(0).children().remove();
	});
	// 上传课件操作
	$("#uploadclassfile p").click(function(event) {
		$("#uploadcoursefile").trigger("click");
		$("#uploadcoursefile").change(function(event) {
			var upload_file = $(this)[0].files[0];
			console.log(upload_file.name);
			var newItem = $("<li>"+upload_file.name+"</li>");
			$("#uploadFiles").append(newItem);
			var formdata = new FormData();
			if (upload_file!==undefined) {
				alert("success");
			}
			for (var i=0,file; file=upload_file[i]; i++) {
				formdata.append(file.name,file);
			}
			$.ajax({
				url: '/path/to/file',
				type: 'POST',
				data: formdata
			})
			.done(function() {
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
			
		});
				
	});
	// 全屏切换
	$("#windows_full").click(function(event) {
		fullScreen();
		$(this).hide();	
	});
	
	document.onkeydown = function(event){
		event.preventDefault();
		if (event.keyCode==27) {
			$("#windows_full").show();
		}
	}
	// alert(isSupportFileApi());
	// alert(isSupportFormData());
	// 点击播放音乐按钮
	$("#play_music_ct p").click(function(event) {
		
	});
	//上传附件
	$(".up_op input[type='file']").change(function(event) {
		var up_files = $(this)[0].files;
		formdata = new FormData();
		for(i=0;i<up_files.length;i++){
			var newList = $("<li>"+up_files[i].name+"</li>")
			$(".upload_details ul").append(newList);
			formdata.append('upload',up_files[i]);
		}
	});
	$(".up_op input[type='submit']").click(function(event) {
		$(".progress").css({
			display: 'block'
		});
		$.ajax({
			url: '/path/to/file',
			type: 'POST',
			dataType: 'json',
			data: formdata,
		})
		.done(function() {
			console.log("success");
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		
	});
});
//保存电子白板的板书内容为png格式的图片
function save(){
	var dataURL = document.getElementById("wb1").children[1].toDataURL("image/png");
	dataURL = dataURL.replace("image/png", "image/octet-stream");
	document.location.href = dataURL;
}
function afterUpload(){
		var file = $("#uploadcoursefile")[0].files[0];
		console.log(file+"777");
		alert(444);
}
function triggerUpload(){
	var dfd = $.Deferred();
	setTimeout(function(){
		$("#uploadcoursefile").trigger('click');
		dfd.resolve();
	},500);
	return dfd.promise();
}
//全屏  
function fullScreen() {   
  var element= document.documentElement; //若要全屏页面中div，var element= document.getElementById("divID");  
  // IE 10及以下ActiveXObject  
  if (window.ActiveXObject)  
  {  
    var WsShell = new ActiveXObject('WScript.Shell')   
    WsShell.SendKeys('{F11}');   
  }  
  //HTML W3C 提议  
  else if(element.requestFullScreen) {    
    element.requestFullScreen();    
  }  
  // IE11  
  else if(element.msRequestFullscreen) {   
    element.msRequestFullscreen();    
  }  
  // Webkit (works in Safari5.1 and Chrome 15)  
  else if(element.webkitRequestFullScreen ) {    
    element.webkitRequestFullScreen();    
  }   
  // Firefox (works in nightly)  
  else if(element.mozRequestFullScreen) {   
    element.mozRequestFullScreen();    
  }    
}  
  
//退出全屏  
function fullExit(){  
  var element= document.documentElement;//若要全屏页面中div，var element= document.getElementById("divID");   
  //IE ActiveXObject  
  if (window.ActiveXObject)  
  {  
    var WsShell = new ActiveXObject('WScript.Shell')   
    WsShell.SendKeys('{F11}');   
  }  
  //HTML5 W3C 提议  
  else if(element.requestFullScreen) {    
    document.exitFullscreen();  
  }  
 //IE 11  
  else if(element.msRequestFullscreen) {    
    document.msExitFullscreen();  
  }  
  // Webkit (works in Safari5.1 and Chrome 15)  
  else if(element.webkitRequestFullScreen ) {    
    document.webkitCancelFullScreen();   
  }   
  // Firefox (works in nightly)  
  else if(element.mozRequestFullScreen) {    
    document.mozCancelFullScreen();    
  }   
}  

// 是否支持file API
function isSupportFileApi(){
	if (window.File&&window.FileReader&&window.FileList&&window.Blob) {
		return true;
	}
	return false;
}
function isSupportFormData(){
	if (window.FormData) {
		return true;
	}
}