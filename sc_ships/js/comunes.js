// Este es el NameSpace principal:
var CUTCSA = CUTCSA || {};

//Esta Funcion Facilita la creacion de nuevos NameSpaces:
CUTCSA.CreateNameSpace = function (namespace) {
	var nsparts = namespace.split(".");
	var parent = CUTCSA;

	// we want to be able to include or exclude the root namespace 
	// So we strip it if it's in the namespace
	if (nsparts[0] === "CUTCSA") {
		nsparts = nsparts.slice(1);
	}

	// loop through the parts and create 
	// a nested namespace if necessary
	for (var i = 0; i < nsparts.length; i++) {
		var partname = nsparts[i];
		// check if the current parent already has 
		// the namespace declared, if not create it
		if (typeof parent[partname] === "undefined") {
			parent[partname] = {};
		}
		// get a reference to the deepest element 
		// in the hierarchy so far
		parent = parent[partname];
	}
	// the parent is now completely constructed 
	// with empty namespaces and can be used.
	return parent;
};

CUTCSA.CreateNameSpace("CUTCSA.Web"); //<- Este es el Namespace de la Aplicación

CUTCSA.Web.Config = null; //<- Aqui se guardan los valores de Configuracion de la Aplicacion

//Carga el archivo de configuracion
CUTCSA.Web.CargarConfiguracion = function (pFile){   
	$.ajax({
		url: pFile,
		dataType: 'json',
		async: false,
		success: function (data)
		{			   
			CUTCSA.Web.Config = data;
		}
	});
}

CUTCSA.Web.GetUrlParam = function(pNombreParametro) {
	//---------------------------------------------------------------------------------------------------------
	//Esta funcion devuelve el valor de un parametro pasado por URL a la página
	// pNombreParametro:	Nombre del Parametro URL que se desea consultar
	//---------------------------------------------------------------------------------------------------------
	//USO:  urlParam('user')
	//---------------------------------------------------------------------------------------------------------
	var results = new RegExp('[\\?&]' + pNombreParametro + '=([^&#]*)').exec(window.location.href);
	if (results == null) {
		return null;
	} else {
		return results[1] || 0;
	}
}

CUTCSA.Web.supports_html5_storage = function() {
	//------------------------------------------------------------
	// Verifica el soperte del navegador para HTML5 y Local Storage
	// Devulkeve 'true' si es soportado.
	//------------------------------------------------------------
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

CUTCSA.Web.DetectarNavegador = function() {
	var ret = null;
	try {
		var useragent = navigator.userAgent;
		if (useragent.indexOf('Safari') != -1) { ret = 'Safari'; }
		if (useragent.indexOf('Chrome') != -1) { ret = 'Chrome'; }
		if (useragent.indexOf('Trident') != -1) { ret = 'IExplorer v11+'; }
		if (useragent.indexOf('MSIE') != -1) { ret = 'IExplorer v10 o menor'; }	  
		if (useragent.indexOf('Firefox') != -1) { ret = 'Firefox'; }
		if (useragent.indexOf('Opera') != -1) { ret = 'Opera'; }	  
		if (useragent.indexOf('Android') != -1) { ret = 'Android'; }
		if (useragent.indexOf('Opera Mobi') != -1) { ret = 'Opera Mobile'; }
		if (useragent.indexOf('Opera Mini') != -1) { ret = 'Opera Mini'; }
		if (useragent.indexOf('iPhone') != -1) { ret = 'iPhone'; }
		if (useragent.indexOf('iPad') != -1) { ret = 'iPad'; }
	} catch(e) {
		ret = e;
	}
	return ret;
}

CUTCSA.Web.ShowMessage = function(pJsonConfig, pDivName, pTitulo, pMensaje, pEstilo, pClickToClose){
	//------------------------------------------------------------
	//--        Muestra un Mensaje de Notificacion             ---
	//---------------------------------------------------------------------------------------------------------
	//pDivName:		Nombre del DIV donde se muestra el Mensaje, ejem: '#divMessage'
	//pTitulo:		Titulo del Mensaje (puede contener tags HTML)
	//pMensaje:		Texto del mensaje (puede contener tags HTML)
	//pEstilo: 		Determina el Estilo del Mensaje, valores posibles: info, error, warning, success.
	//pClickToClose:	True=Click para Cerrar, False=No se Cierra
	//---------------------------------------------------------------------------------------------------------
	//USO: <div id="divMessage" hidden></div>
	//CUTCSA.Web.ShowMessage('Error de Validación:', 'El número de Interno no existe o no es correcto!', 'error', true);
	//---------------------------------------------------------------------------------------------------------
	try {
		var newHTML = "";
		var icon = "";

		switch(pEstilo) {
			case 'info': icon = "msg_info.png"; break;
			case 'error':icon = "msg_error.png"; break;
			case 'warning':icon = "msg_warning.png"; break;
			case 'success':icon = "msg_ok.png"; break;
		}

		$( pDivName ).hide();
		$( pDivName ).removeClass();
		$( pDivName ).empty();
		
		//console.log(pJsonConfig);

		newHTML += '<table style="width: 100%"><tr>';
		//http://localhost/thuban_web/img/msg_error.png
		newHTML += '<td><img src="' + pJsonConfig.otros.url + 'img/' + icon + '" alt="Cutcsa" height="64px" style="vertical-align: middle"/></td>';
		newHTML += '<td width="95%" ><h3>' + pTitulo + '</h3>';
		newHTML += '<p>' + pMensaje + '</p>';
		newHTML += '<p style="font-size:xx-small;">Click aquí para Cerrar</p>' ;	
		newHTML += '</td><td width="5%"><a href="#" class="ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all"></a></td></tr></table>' ;

		$( pDivName ).append(newHTML);
		$( pDivName ).attr('title', 'Click aquí para Cerrar');
		$( pDivName ).addClass(pEstilo);
		$( pDivName ).addClass('message');		  

		$(document).on("click", pDivName, function(evt) { $( pDivName ).hide(); });
		$( pDivName ).slideDown("slow");

		/*if (pClickToClose) {
		 $(document).on("click", pDivName, function(evt) { $( pDivName ).hide(); });
		 $( pDivName ).attr('title', 'Click aquí para Cerrar');
		 $( pDivName ).append( '<p style="font-size:xx-small;">Click aquí para Cerrar</p>' );		 
	  }	else {
		 $( pDivName ).attr('title', 'Presione F5 para Cerrar');		 
	  }*/  

		// $(document).on("click", pDivName, function(evt) { $( 'cmdMsgClose' ).hide(); });

	} catch(e) {
		alert(e.stack);
	}
}

CUTCSA.Web.Notify = function(pTitulo, pMensaje, pEstilo, pTimeout, pCallback){
	// Mustra una Notificacion, veáse: http://ned.im/noty/
	/* --------------PARAMETROS:--
    * 	pTitulo: 	Titulo de la Notificacion
    *	pMensaje: 	Texto del Mensaje, puede incluir HTML.
    *	pEstilo: 	Tipo predeterminado de la notificacion, valores: 'Alerta','Exito','Error','Pregunta'.
    *	pTimeout: 	Tiempo(ms) para cerrar automaticamente, false para deshabilitar.
    *	pCallback: 	Funcion llamada al dar click en un boton (cuando pEstilo='Pregunta').
    *--------------------------*/
	try {
		var imagen = 'msg_info';
		var imgSize = '82';
		var tipo = 'alert'; //alert, error, success, information, warning, confirm
		var botones = false;

		switch (pEstilo) {
			case 'Alerta':
				imagen = 'msg_info'; imgSize = '24';			
				pTitulo = '';
				tipo = 'alert';
				break;
			case 'Exito':
				imagen = 'msg_ok'; imgSize = '82';
				tipo = 'alert';
				pTitulo = '<h2>'+pTitulo+'</h2>';
				break;
			case 'Error':
				imagen = 'msg_error'; imgSize = '82';
				tipo = 'error';
				pTitulo = '<h2>'+pTitulo+'</h2>';
				break;
			case 'Pregunta':
				imagen = 'msg_question'; imgSize = '82';
				tipo = 'information';
				pTitulo = '<h2>'+pTitulo+'</h2>';
				botones = [
					{addClass: 'btn btn-primary', text: 'Aceptar', onClick: function($noty) {
						$noty.close();
						pCallback('ok');
					}
					},
					{addClass: 'btn btn-danger', text: 'Cancelar', onClick: function($noty) {
						$noty.close();
						pCallback('cancel');
					}
					}
				]
				break;		 
		}
		var n = noty({
			layout: 		'topRight', //top,topLeft,topCenter,topRight, center,centerLeft,centerRight, bottom,bottomLeft,bottomCenter,bottomRight, inline
			type:  		tipo,
			timeout: 		pTimeout,
			text:  		'<table><tr><td><img width="'+imgSize+'" src="../img/'+imagen+'.png" alt="noty" style="float: right"></td><td>'+pTitulo+'<p>'+pMensaje+'</p></td></tr></table>',
			dismissQueue: 	true, // If you want to use queue feature set this true
			force: 		true, // adds notification to the beginning of queue when set to true
			closeWith: 	['button', 'click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all open notifications
			buttons: 		botones 
		});
		/*var n = noty({
			layout: 	'topRight', //top,topLeft,topCenter,topRight, center,centerLeft,centerRight, bottom,bottomLeft,bottomCenter,bottomRight, inline
			type:  		'alert', //alert, error, success, information, warning, confirm
			theme: 		'defaultTheme',
			text:  		'<table><tr><td><img width="82" src="../img/msg_ok.png" alt="noty" style="float: right"></td><td><h2>Exito!</h2><p>Los cambios se Guardaron correctamete.</p></td></tr></table>', // can be html or string
			template: 	'<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
			dismissQueue: true, // If you want to use queue feature set this true
			maxVisible: 6, // you can set max visible notification for dismissQueue true option,
			timeout: 	false, //delay in milliseconds for closing event. Set false for sticky notifications
			force: 		false, // adds notification to the beginning of queue when set to true
			modal: 		false,
			killer: 	false, // true to close all notifications before show
			animation: {
			   open: 	{height: 'toggle'},
			   close: 	{height: 'toggle'},
			   easing: 	'swing',
			   speed: 	500 // opening & closing animation speed
			},			
			closeWith: ['button', 'click'], // ['click', 'button', 'hover', 'backdrop'] // backdrop click will close all open notifications
			callback: { //Eventos de la notificacion
			   onShow: 		function() {}, //Al mostrar
			   afterShow: 	function() {}, //Antes de mostrar
			   onClose: 	function() {}, //Al cerrar
			   afterClose: 	function() {} //Despues de cerrar
		    },
			buttons: 	false // an array of buttons */
		/*buttons: [
			   {addClass: 'btn btn-primary', text: 'Aceptar', onClick: function($noty) {

				   // this = button element
				   // $noty = $noty element

				   $noty.close();
				   noty({force: true, text: 'You clicked "Ok" button', type: 'success'});
				 }
			   },
			   {addClass: 'btn btn-danger', text: 'Cancelar', onClick: function($noty) {
				   $noty.close();
				   noty({text: 'You clicked "Cancel" button', type: 'error'});
				 }
			   }
			]*/
		//});*/
	} catch(e) {
		console.log(e);
	}
}  

CUTCSA.Web.ReadTextFile = function(pFilePath) {
	//--------------------------------------------------------
	//-- Lee un Archivo de Texto  
	//-- pFilePath:	es la ruta (URL) del archivo a leer
	//--------------------------------------------------------
	var file_ret = null;
	try{
		//console.log(pFilePath);
		//Aqui se usa JQuery para leer el contenido del archivo
		$.ajax({
			url: pFilePath,
			dataType: 'text',
			async: false,
			success: function (data)
			{
				file_ret = { Name:pFilePath, FileEntry:null, FileInfo:null, FileData: data, Error: null };

				//Ahora intentaremos Obtener las propiedades del archivo (Si el navegador lo soporta)
				if (window.File && window.FileReader && window.FileList && window.Blob) {
					// Aqui se hace una solicitud al sistema de archivos:
					window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
					window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs) { //5Mb file limit
						//console.log('Opened file system: ' + fs.name);

						fs.root.getFile(pFilePath, {}, function(fileEntry) {
							console.log(fileEntry);
							fileEntry.file(function(file) {
								//console.log(fileEntry);
								file_ret = { Name:file.name, FileEntry:fileEntry, FileInfo:file, FileData: data, Error: null };
							});			   
						});			
					}, function(Error) {
						var err = '';
						switch (e.code) {
							case FileError.QUOTA_EXCEEDED_ERR:  err = 'QUOTA_EXCEEDED_ERR'; break;
							case FileError.NOT_FOUND_ERR: err = 'NOT_FOUND_ERR'; break;
							case FileError.SECURITY_ERR: err = 'SECURITY_ERR'; break;
							case FileError.INVALID_MODIFICATION_ERR: err = 'INVALID_MODIFICATION_ERR'; break;
							case FileError.INVALID_STATE_ERR: err = 'INVALID_STATE_ERR'; break;
							default: err = 'Unknown Error'; break;
						};
						file_ret = { Name:pFilePath, FileEntry:null, FileInfo:null, FileData: data, Error: err };
						console.log(err);
					}
											);		 
				} else {
					file_ret = { Name:pFilePath, FileEntry:null, FileInfo:null, FileData: data, Error: 'The File APIs are not supported in this browser.' };
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				console.log(textStatus + errorThrown);
				file_ret = { Name:pFilePath, FileEntry:null, FileInfo:null, FileData: data, Error: (textStatus + errorThrown) };
			} 
		});
	}catch(e){
		console.log(err);
		file_ret = { Name:pFilePath, FileEntry:null, FileInfo:null, FileData: data, Error: e };
	}	
	return file_ret;
}

CUTCSA.Web.GetMetaTagValue = function (pMetaTagName) { 
	//Obtiene el valor de la etiqueta Meta indicada	
	var m = $("meta[name="+pMetaTagName+"]");
	var content = m.attr("content");
	return content;
}

CUTCSA.Web.DownloadFile = function (fileURL, fileNameSave) {
	//Inicia la descarga de un archivo remoto:
	/* fileURL = Url del archivo a descargar
    * fileNameSave = Nombre predeterminado para el archivo a guardar    */
	// for non-IE
	if (!window.ActiveXObject) {
		var save = document.createElement('a');
		save.href = fileURL;
		save.target = '_blank';
		save.download = fileNameSave || 'unknown';

		var event = document.createEvent('Event');
		event.initEvent('click', true, true);
		save.dispatchEvent(event);
		(window.URL || window.webkitURL).revokeObjectURL(save.href);
	}

	// for IE
	else if ( !! window.ActiveXObject && document.execCommand)     {
		var _window = window.open(fileURL, '_blank');
		_window.document.close();
		_window.document.execCommand('SaveAs', true, fileName || fileURL)
		_window.close();
	}
}

CUTCSA.Web.PrintHtmlElement = function (ElementID){
	//Imprime un elemento de la pagina
	var divToPrint=document.getElementById(ElementID);
	newWin= window.open("");
	newWin.document.write(divToPrint.outerHTML);
	newWin.print();
	newWin.close();
}

// Declaracion de Eventos:ç
//-------------------------------------------------
CUTCSA.event = {
	addListener: function(el, type, fn) {
		//  code stuff
	},
	removeListener: function(el, type, fn) {
		// code stuff
	},
	getEvent: function(e) {
		// code stuff
	}

	// Can add another method and properties
}
//Syntax for Using addListner method:
//CUTCSA.event.addListener("yourel", "type", callback);
//----------------------------------------------------

//Esta funcion Formatea numeros:
// c=Cantidad de Decimales a redondear (hacia arriba)
// d=Simbolo Decimal, por defecto es '.'
// t=Separador de miles, por defecto es ','
//Ejemplo: (123456789.12345).formatMoney(2, ',', '.');
//		var Numero = 1234.5678;
//		console.log(Numero.formatMoney(2, ',', '.'););
Number.prototype.formatMoney = function(c, d, t){
	var n = this, 
		c = isNaN(c = Math.abs(c)) ? 2 : c, 
		d = d == undefined ? "." : d, 
		t = t == undefined ? "," : t, 
		s = n < 0 ? "-" : "", 
		i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
		j = (j = i.length) > 3 ? j % 3 : 0;
	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
