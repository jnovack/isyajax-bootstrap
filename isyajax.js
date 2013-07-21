/*
* ISY AJAX
* http://sites.google.com/site/isyajax/
* Copyright 2011, Nicholas Stein
* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

var getNodesCache = new Array();
var restxml = new Array();
var cache = {xml:[],json:[],html:[],options:[]};
var sortOrder = "name";
var callbackOptions;
var controls = [];
var modules = {};
var isyName = "My Lighting";
var eMeterUrlBase;
var nodes = [];
var cacheLocal = false;
var hash;//stores a copy of what we set the hash to, to check against for external changes
var uHash = false; //enables/disables updating hash for history
function closeWin() //Copied from default web page, probably not needed.
{
	window.open("/WEB/CLOSE.HTM","_self"); 
}
function updateTitle(url)
{
	switch (url){
		case "/config/":
		case "/config":
			title(isyName);
		break;
		case "/nodes/":
		case "/nodes":
			title("Devices & Scenes");
		break;
		case "/nodes/devices/":
		case "/nodes/devices":
			title("Devices");
		break;
	
		case "/nodes/scenes/":
		case "/nodes/scenes":
			title("Scenes");
		break;
		case "/climate/":
		case "/climate":
			title("My Weather");
		break;
		case "/emeter/":
		case "/emeter":
			title("My Energy");
		break;
		case "/networking/resources/":
		case "/networking/resources":
			title("Networking Resources");
		break;
		case "/networking/wol":
		case "/networking/wol/":
			title("Networking WOL");
		break;
		case "/status/":
		case "/status":
		break;
                case "/time":
                case "/time/":
                    title("Time");
                    break;
                case "/vars/definitions/1":
                case "/vars/definitions/1/":
                    title("Variables, Int");
                case "/vars/definitions/2":
                case "/vars/definitions/2/":
                    title("Variables, State");
                case "/elk/get/topology":
                case "/elk/get/topology/":
                    title("ELK");
                default :
                    //title(isyName);
	}
}
function title(string)
{
	document.title = string;
	if ($('#title').html() != string)
	{$('#title').html(string);}
}
function update(url)
{	
    update (url, false);
}
function update(url, target)
	{
    if (!url && target)//if we have a target search for .update tags in that target
    {
        $(target + ' .update').each(function(){
            //fetch update based on the url in the found update tags
            fetch (this.value, {
                update:true,
                target:"#main"
            });
        });
    }
    else if (!url)//no url and no target above search for .update tags in hole body
    {
        $('.update').each(function(){
            //fetch update based on the url in the found update tags
            fetch (this.value, {
                update:true,
                target:"#main"
            });
        });
    }
    else {//we have a url, fetch update for that url
        fetch (url, {
            update:true,
            target:"#main"
        });
    }
}
function updateFilter(url){//filter out anything with null in it.
    if (url.indexOf("null") < 0)//if null is not found pass the url to update
    {
        update(url);
    }
}
function display (url, target, template, postCode)
{
    fetch (url, {url:url,target: target, template: template, update: false, postCode : postCode});
}
function display2(url, target, template, fCode)//No History, No updating hash
{
    fetch (url, {url:url,target: target, template: template, update: false, fCode: fCode, uHash:false});
}
function fetch(url, options)
{
    //console.log("fetch called", options);
	if (!options)
	{options = [];}
	if (!url)
	{url = "/config/";}
	
	if (url.charAt(0) != "/")
	{url = "/" + url;}
	if (!options.update)
	{
		if(url == "/status/")
		{options.update = true;}
		else {options.update = false;}
	}
        if (options.update == true)//do not use cache if we are updating a page
        {
            options.cacheXml = false;
            options.cacheHtml = false;
            options.cacheLocal = false;
            options.cacheJson = false;
        }
	if (!options.target)
	{
		options.target = "#main";
	}
    if (options.target == "#main" && options.update == false)
    {
        //update title based on url
        updateTitle(url);
        //update hash info
        hash = url;//start hash info with request url
        if (options.template)//if using a template add that to hash info,
        {
           hash = url + "&tmpl=" + options.template;
        }
        //if we are updating hash and it dosn't already match what we think it should, set it
        if (uHash && options.uHash != false && location.hash.slice(1) != hash)
        {
            //location.hash = "#" + hash;
            location.href = "#" + hash;   
        }
    }
	options.url = url;
	
	if (!options.cacheHtml)
	{
		if (url == "/nodes/" || url == "/nodes/scenes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes/scenes" || url == "/nodes")
		{
			options.cacheHtml = true;
		}
		else {options.cacheHtml = false;}
	}
	if (!options.cacheXml)
	{
		if (url == "/nodes/" || url == "/nodes/scenes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes/scenes" || url == "/nodes")
		{
			//options.cacheXml = true;
		}
		else if (url == "/config" || url == "/config/" ) {
			options.cacheXml = true;
		}
		else{options.cacheXml = false;}
	}
        if (!options.cacheLocal)
	{
		if (url == "/nodes/" || url == "/nodes/scenes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes/scenes" || url == "/nodes")
		{
			options.cacheLocal = true;
		}
		else if (url == "/config" || url == "/config/" ) {
			options.cacheLocal = false;
		}
		else{options.cacheLocal = false;}
	}
        if (cacheLocal == false | !$.jStorage){options.cacheLocal = false;}//disable local caching
	if (!options.cacheJson)
	{
		if (url == "/config" || url == "/config/" )
		{
			//options.cacheJson = true;
		}
		else{options.cacheJson = false;}
	}

	if(options.cacheHtml == true && cache.html[url])//Use cached html data
	{
            //console.log('Loading from cached html ... ' + url);
            feedback('Loading from cached html ... ' + url);
            $(options.target).html(cache.html[url]);
            feedback('<br>');
            if (url == "/nodes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes")
            {
                    update("/status/");
            }
            else if (url.indexOf("programs") >= 0)
            {
                    update(url);
            }
            if (options.postCode)
            {
                feedback('Processing ... (Processing Post Javascript)');
                //try{
                    eval(options.postCode);
                //}
                //catch(e)
                //{feedback(e.description + '<br>Processing PostCode');}
            }
            if (options.fCode)
            {
                //feedback('Processing ... (Processing Final Javascript)');
                //try{
                    eval(options.fCode);
                //}
                //catch(e)
                //{feedback(e.description + '<br>Processing fCode');}
	    }
        }
	else if(options.cacheJson == true && cache.json[url])//Use cached json data
	{
            if (!options.template){options.template = cache.options.template;}
            if (!options.target){options.template = cache.options.target;}
            var json = cache.json;
            //Load and process template *************************************************
            feedback('Processing node list ... (Loading template)');
            $(options.target).setTemplateElement(options.template);
            feedback('Processing node list ... (Processing template)');
            $(options.target).processTemplate(json);
            feedback('<br>');
	}
	else if(options.cacheXml == true && cache.xml[url])//Use cached xml data
	{
            feedback('Loading from cached xml ... ' + url);
            displayReply(cache.xml[url], options);
            if (url == "/nodes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes")
            {
                    options.update = true;
                    update("/status/");
            }
	}
        else if(options.cacheLocal == true && jQuery.inArray(url, $.jStorage.index()) >= 0)//Load from local storage if possible
        {
            //console.log(url, $.jStorage.index(), jQuery.inArray(url, $.jStorage.index()));
            feedback('Loading xml from local storage... ' + url);
            //alert("test");
            displayReply($.jStorage.get(url, false),options);
            //alert("test2");
            //setTimeout("alert('test');displayReply($.jStorage.get(\"" + url + "\", false),'" + $.toJSON(options) + "');alert('test2');",2000);
            
            if (url == "/nodes/" || url == "/nodes/devices/" || url == "/nodes/devices" || url == "/nodes")
            {
                    options.update = true;
                    update("/status/");
            }
        }
	else  //fetch xml data and pass it to displayReply function
	{
		if (url.indexOf("/rest") < 0)
		{var completeUrl = "/rest" + url;}else {var completeUrl = url;}
		feedback('Requesting ... ' + url);
		$.ajax({
				type: "GET",
				timeout: 60000,
				url: /*'http://isy.internal' + */completeUrl/* , username: 'admin', password: 'admin',*/,
				dataType: 'xml',
				error: function(XMLHttpRequest, textStatus, errorThrown){
					feedback(textStatus + ',  Loading: ' + url, "error");
				},
				success: function(data){
					feedback('Received ... ' + url);
                                        
					if (options.cacheXml == true)//Cache xml data
					{
                                            feedback('Caching xml ... ' + url);
                                            cache.xml[url] = data;
					}
                                        if  (options.cacheLocal == true)
                                        {
                                            feedback('Caching to local ... ' + url);
                                            $.jStorage.set(url, data);
                                            //console.log($.jStorage.index());
                                        }
					
					displayReply(data, options);
					
				}
		});
	}
}
function displayReply (data, options)
{
    if (!data){return false;}
    feedback('Processing data ... ' + options.url);
    var json = new Array();
    var updateUrl = false;
    if (!options)
        {
                options = {update:false};
        }
    if (!options.postCode){options.postCode = "";}
	if ($(data).find('nodes').size())//Nodes ***************************************************************************************************************
	{
		if (!options.template){options.template = "nodes";}
		if (options.update == false || options.update == true)
		{
			json = {nodes:[]};var ni = 0;
			//Convert data into array and fill template
			feedback('Processing node list ... (Folders)');//*******************************************************************
				$(data).find('folder').each(function(){
					var flag = $(this).attr('flag');
					var address = $(this).find('address').text();
					var id = address.replace(/\ /g,'_') //converts address into id by replacing spaces with _
					var name = $(this).find('name').text();
					var enabled = bool($(this).find('enabled').text());
					var parent = $(this).find('parent').text();
					var parentId = parent.replace(/\ /g,'_') //converts address into id by replacing spaces with _
					var parentType = $(this).find('parent').attr('type');
					json.nodes[ni] = {name:name, flag:flag, address: address, status: "", statusClass: "", enabled:true, parent:parent, parentId:parentId,parentType:parentType, id:id, folder:true};
					json[id] = json.nodes[ni];
						if (parent && json[parentId])
						{
							if (json[parentId].nodes)
							{
								json[parentId].nodes[json[parentId].nodes.length] = json.nodes[ni];
							}
							else
							{
								json[parentId].nodes = [];
								json[parentId].nodes[0] = json.nodes[ni];
							}
						}
					ni ++;
				});	
			feedback('Processing node list ... ');
			//Converts XML into array
		    	feedback('Processing node list ... (Processing Devices ...)');//******************************************************************
				$(data).find('node').each(function(){
					
					if (options.url != "/status/" && options.url != "/status")// if we requested status these attributes won't be there
					{
						var family = parseInt($(this).find('family').text());
						var type = $(this).find('type').text();
						var cat = parseInt(type.split(".")[0]); //Device Catagory is the before the first . in device type
                                                var subCat = parseInt(type.split(".")[1]);
						var flag = $(this).attr('flag');
						var address = $(this).find('address').text();
                                                var group = address.split(" ")[3];//number of the group/button on the device
						var name = $(this).find('name').text();
						var status = $(this).find('property').attr('formatted');
						var enabled = bool($(this).find('enabled').text());
						var parent = $(this).find('parent').text();
						var parentId = parent.replace(/\ /g,'_') //converts address into id by replacing spaces with _
						var parentType = $(this).find('parent').attr('type');
						//This is redundent and only used for simplicity and backwards compatibility	
						if ($(this).find('property').attr('uom'))
						{var uom = $(this).find('property').attr('uom');}
						else{var uom = "";}
						status = format(status, uom);
						var statusClass;
						if (status == "Off")
						{
							statusClass = "off";
						}
						else
						{
							statusClass = "on";
						}	
						statusClass += " ST";
					}
					else
					{	
						var address = $(this).attr('id');
					}
					var id = address.replace(/\ /g,'_') //converts address into id by replacing spaces with _
					if (update != true)
					{json.nodes[ni] = {name:name, flag:flag, address: address, group: group, family: family, type: type, cat: cat, subCat: subCat, status: status, statusClass: statusClass, id:id, enabled:enabled, parent:parent,parentId:parentId, parentType:parentType, properties:[], nodes:false};}
					//console.log( 'type=' + type );
			    	$(this).find('property').each(function(pi){			
						var propertyid = $(this).attr('id');
						var propertylabel;
						var propertyformatted = $(this).attr('formatted');
						if ($(this).attr('uom'))
						{var uom = $(this).attr('uom');}
						else {var uom = "";}
						propertyformatted = format(propertyformatted, uom);
						propertylabel = controls[propertyid].label;
						propertylabelshort = controls[propertyid].labelShort;
						var propertyClass;
                                                if (uom == "degrees" | uom == "n/a"){
                                                    propertyClass = "na";
                                                }
                                                else
                                                {
                                                    if (propertyformatted == "Off")
                                                    {
                                                        propertyClass = "off";
                                                    }
                                                    else
                                                    {
                                                        propertyClass = "on";
                                                    }
                                                }
						
						propertyClass += " " + propertyid;
						if( type && ( type.indexOf('5.3.') == 0  ) ) {
							//thermostat
							if( propertyid == 'ST' ) {
								propertyClass += " " + "temperature";
							}

							if( propertyid == 'CLIHUM' ) {
								propertyClass += " " + "humidity";
							}
						}
						if (propertyid == "CLIMD" && (options.update == false || $("#node" + id + propertyid).html() != propertyformatted))
						{
							
							switch (propertyformatted.toLowerCase()){
								case "program auto":
								case "auto":
									options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPC").show();';
									options.postCode += '$(".properties .node' + id + 'CLISPH").show();';
									options.postCode += '$(".properties .node' + id + 'CLISPC .propertylabelshort").show();';
									options.postCode += '$(".properties .node' + id + 'CLISPH .propertylabelshort").show();';
									propertyClass += " " + "auto";
								break;
								case "program cool":
								case "cool":
                                                                case "cooling":
									options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPC").show();';
									options.postCode += '$(".properties .node' + id + 'CLISPH").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPC .propertylabelshort").hide();';
									propertyClass += " " + "cool";
								break;
								case "program heat":
								case "heat":
                                                                case "heating":
									options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPC").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPH").show();';
									options.postCode += '$(".properties .node' + id + 'CLISPH .propertylabelshort").hide();';
									propertyClass += " " + "heat";
								break;
								case "off":
									options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPC").hide();';
									options.postCode += '$(".properties .node' + id + 'CLISPH").hide();';
								break;			
								default :
									$(".properties .node" + id + "CLISP").show();
									$(".properties .node" + id + "CLISPC").hide();
									$(".properties .node" + id + "CLISPH").hide();
							}	
						}
						json.nodes[ni].properties[pi] = {id: propertyid, label: propertylabel, labelShort: propertylabelshort, formatted: propertyformatted, pclass: propertyClass};
						json[id] = json.nodes[ni];
						if (parent && json[parentId])
						{
							if (json[parentId].nodes)
							{
								json[parentId].nodes[json[parentId].nodes.length] = json.nodes[ni];
							}
							else
							{
								json[parentId].nodes = [];
								json[parentId].nodes[0] = json.nodes[ni];
							}
						}
						if (options.update == true)
						{
							if($("#node" + id + propertyid).html() != propertyformatted)//If property has changed
							{
									$("#node" + id + propertyid).html(propertyformatted);//update property
									$("#node" + id + propertyid).attr("className", propertyid + " " + propertyClass);//update class
							}
						}
					});
					ni ++;					
				});
		    	feedback('Processing node list ... (Scenes)');//*******************************************************************
				$(data).find('group').each(function(){
					//var type = "scene";
					//var cat = "scene";
					var flag = $(this).attr('flag');
					var address = $(this).find('address').text();
					var id = address.replace(/\ /g,'_') //converts address into id by replacing spaces with _
					var name = $(this).find('name').text();
					var status = "";
					var statusClass = "";
					var enabled = bool($(this).find('enabled').text());
					var parent = $(this).find('parent').text();
					var parentId = parent.replace(/\ /g,'_') //converts address into id by replacing spaces with _
					var parentType = $(this).find('parent').attr('type');
					json.nodes[ni] = {name:name, flag:flag, address: address, status: status, statusClass: statusClass, enabled:enabled, parent:parent, parentId:parentId,parentType:parentType, id:id};
					json[id] = json.nodes[ni];
					if (parent && json[parentId])
						{
							if (json[parentId].nodes)
							{
								json[parentId].nodes[json[parentId].nodes.length] = json.nodes[ni];
							}
							else
							{
								json[parentId].nodes = [];
								json[parentId].nodes[0] = json.nodes[ni];
							}
						}
					ni ++;
				});		
					
				if (update != true)//Sorts list
				{
					feedback('Processing node list ... (Sorting List)');
					json.nodes.sort(sortBy);
					if (options.url == '/nodes' || options.url == '/nodes/') 
					{
						nodes = new Array();
						nodes = nodes.concat(json)[0];
					}
				}
		}   
    }
    else if ($(data).find('nodeInfo').size())//Single Node *******************************************************************************************************
    {
		if (!options.template){options.template = "node";}
		feedback('Processing node ...');
		feedback('Processing node ... (Processing Data)');
		var nodedata = new Array();
	
		var thisnode = $(data).find('node');
		
		if ($(data).find('node').size() < 1){thisnode = $(data).find('group');}//if node is not found use group
		var name = $(thisnode).find('name').text();
		var flag = $(thisnode).attr('flag');
		var address = $(thisnode).find('address').text();
                var id = address.replace(/\ /g,'_') //removes spaces and other problematic characters replaces with '_'
                var group = address.split(" ")[3];//number of the group/button on the device
                var family = parseInt($(thisnode).find('family').text());
		var type = $(thisnode).find('type').text();
		var cat = parseInt(type.split(".")[0]);
                var subCat = parseInt(type.split(".")[1]);
		var enabled = $(thisnode).find('enabled').text();
		var parent = $(thisnode).find('parent').text();
		var parentId = parent.replace(/\ /g,'_') //converts address into id by replacing spaces with _
		var parentType = $(thisnode).find('parent').attr('type');
		var index = 0;
		//alert ($(thisnode).find('properties'));
		if (options.update != true)
		{
			title(name);
		}
	    json = {name:name, flag:flag, address:address, group:group, family: family, type:type, cat:cat, subCat:subCat, properties: [], enabled:true, parent:parent, parentId:parentId,parentType:parentType, id:id, controls: [], nodes: false};
	    if (nodes[id] && nodes[id].nodes)
	    {
			json.nodes = nodes[id].nodes;
		}
	    if (!cat)//Scene
	    {
			json.controls = ['DON', 'DOF', 'DFON', 'DFOF', 'BRT', 'DIM', 'ST'];	
		}
		else //if (flag != 0)
		{//Determines Controls to show for each device cat
                switch (family){
                    case 3://RCS Zigbee
		    switch (cat){
                            case 5: //Thermostat
                                json.controls = ['rcsCLISPH', 'rcsCLISPC', 'rcsCLIMD', 'rcsCLIFS', 'ST'];
                        }
                    break;
                    default://Insteon
                        switch (cat){
				case 0://Generalized Controllers  ControLinc, RemoteLinc, SignaLinc, etc. 
					json.controls = [];
				break;
				case 1://Dimmable Lighting Control;  Dimmable Light Switches, Dimmable Plug-In Modules 
                                    if (subCat == 46 && group == '2')//FanLinc Motor Node
                                    {
                                        json.controls = ['DONH', 'DOF', 'DONSS', 'ST'];
                                    }
                                    else
                                    {
					json.controls = ['DON', 'DOF', 'DFON', 'DFOF', 'BRT', 'DIM', 'DONP', 'ST'];
                                    }
				break;
				case 5: //Climate Control; Heating, Air conditioning, Exhausts Fans, Ceiling Fans, Indoor Air Quality 
                                    if (group == '1')
                                    {json.controls = ['PLU', 'MIN', 'CLISPH', 'CLISPC', 'CLIMD', 'CLIFS', 'ST'];}
                                    else
                                    {json.controls = ['ST'];}
				break;
				case 2://Switched Lighting Control;  Relay Switches, Relay Plug-In Modules 
				case 3://Network Bridges;  PowerLinc Controllers
				case 4://Irrigation Control  Irrigation Management, Sprinkler Controllers 
				case 6://Pool and Spa Control  Pumps, Heaters, Chemicals 
				case 7://Sensors and Actuators;  Sensors, Contact Closures 
				case 16://Security, Health, Safety; Door and Window Sensors, Motion Sensors, Scales 
				default://other
					json.controls = ['DON', 'DOF','DFON','DFOF', 'ST'];
			}
		    }
                }
		//else
		//{
		//	json.controls = ['ST'];
		//}
		$(data).find('properties').each(function(){//Finds and fills in properties
	    	$(this).find('property').each(function(){			
				var propertyid = $(this).attr('id');
				var propertylabel;
				var propertyformatted = $(this).attr('formatted');
				if ($(this).attr('uom'))
				{var uom = $(this).attr('uom');}
				else {var uom = "";}
				propertyformatted = format(propertyformatted, uom);
				//detemine label for propertyid
                                if (controls[propertyid])
                                {
                                    propertylabel = controls[propertyid].label;
                                }
                                else
                                {
                                    propertylabel = propertyid;
                                }
                                if (uom == "seconds" | uom == "degrees" | uom == "n/a"){
                                    propertyClass = "na";
                                }
                                else
                                {
                                    if (propertyformatted == "Off")
                                    {
                                        propertyClass = "off";
                                    }
                                    else
                                    {
                                        propertyClass = "on";
                                    }
                                }
				if( type && ( type.indexOf('5.3.') == 0  ) ) {
					//thermostat
					if( propertyid == 'ST' ) {
						propertyClass += " " + "temperature";
					}
					if( propertyid == 'CLIHUM' ) {
						propertyClass += " " + "humidity";
					}
				}
				propertyClass += " " + propertyid;
				if (propertyid == "CLIMD" && (options.update == false || $("#node" + id + propertyid).html() != propertyformatted))
				{
					switch (propertyformatted.toLowerCase()){
						case "program auto":
						case "auto":
							options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPC").show();';
							options.postCode += '$(".properties .node' + id + 'CLISPH").show();';
							options.postCode += '$(".properties .node' + id + 'CLISPC .propertylabelshort").show();';
							options.postCode += '$(".properties .node' + id + 'CLISPH .propertylabelshort").show();';
							propertyClass += " " + "auto";
						break;
						case "program cool":
						case "cool":
                                            case "cooling":
							options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPC").show();';
							options.postCode += '$(".properties .node' + id + 'CLISPH").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPC .propertylabelshort").hide();';
							propertyClass += " " + "cool";
						break;
						case "program heat":
						case "heat":
                                            case "heating":
							options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPC").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPH").show();';
							options.postCode += '$(".properties .node' + id + 'CLISPH .propertylabelshort").hide();';
							propertyClass += " " + "heat";
						break;
						case "off":
							options.postCode += '$(".properties .node' + id + 'CLISP").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPC").hide();';
							options.postCode += '$(".properties .node' + id + 'CLISPH").hide();';
						break;			
						default :
							$(".node" + id + "CLISP").show();
							$(".node" + id + "CLISPC").hide();
							$(".node" + id + "CLISPH").hide();
					}	
				}
				json.properties[index] = {id: propertyid, label: propertylabel, formatted: propertyformatted, pclass: propertyClass};
				index ++;
				if (options.update == true)
				{
					if($("#node" + id + propertyid).html() != propertyformatted)//If property has changed
					{
							$("#node" + id + propertyid).html(propertyformatted);//update property
							$("#node" + id + propertyid).attr("className", propertyid + " " + propertyClass);//update class
					}
				}
				
			})
		});
            //console.log("node json=",json);
	}
	else if ($(data).find('RestResponse').attr('succeeded') == "true" )//cmd sussesfull ***********************************************
	{
            if (options.url.indexOf('vars/') > 0 | options.url.indexOf('elk/') > 0)
            {
                setTimeout ("update();", 800);    
            }
            else if (options.url.indexOf('cmd/') > 0)
            {
                options.update = true;
                //call to update the node, the url - the cmd part
                setTimeout ("update('" + options.url.slice(0,options.url.indexOf('cmd/')) + "');", 800); 
                //display(options.url.slice(0,options.url.indexOf('cmd/'),options));
            }
            else
            {
                setTimeout ("update('" + options.url.slice(0,options.url.lastIndexOf('/',options.url.length - 2)+1) + "');", 800); 
            }
	}
        else if ($(data).find('RestResponse').attr('succeeded') == "false" )//cmd failed ***********************************************
	{
            //console.log("RestResponse failed",options.url);
            if (options.url.indexOf('elk/get/topology') >= 0)//if we fail loading topology display an error
            {
                if (!options.template){options.template = "elkError";}
                json = {error:true};
            }
            if (options.url.indexOf('elk/get/status') >= 0)//if we fail loading status load the status for system instead
            {
                setTimeout ("update('/elk/system/get/status');", 800);   
                options.update = true;
            }
	}
	else if ($(data).find('programs').size())//Programs *******************************************************************************************************
	{
		if (!options.template){options.template = "programs";}
		//var json = {parent:[],programs:[]};
		var template = "programs";
		var index = 0;
		feedback('Processing program list ... ');
		$(data).find('program').each(function(i){
			var name = $(this).find('name').text();
			
			var address = $(this).attr('id');
			var id = address.replace(/\ /g,'_') //converts address into id by replacing spaces with _
			
			var parentId = $(this).attr('parentId');
			var folder = bool($(this).attr('folder'));
			var enabled = bool($(this).attr('enabled'));
			var startup = bool($(this).attr('runAtStartup'));
			var running = $(this).attr('running');
               	 	if (!running){running = "";}//if no running information set to blank so we don't have undefined
			var lastRun = $(this).find('lastRunTime').text();
			var lastFinish = $(this).find('lastFinishTime').text();				
			var nextRun = $(this).find('nextScheduledRunTime').text();	
			
			var status = bool($(this).attr('status'));
                	var statusClass = status + " running" + running;
			var properties = [];
                            properties[0] = {id: "PRGEN", label: "Enabled", formatted: enabled, pclass:enabled};
                            properties[1] = {id: "PRGSU", label: "Startup", formatted: startup, pclass:startup};
                            properties[2] = {id: "PRGRN", label: "Running", formatted: running, pclass:bool(running)};
                            properties[3] = {id: "PRGLR", label: "Last Run", formatted: lastRun, pclass:"na"};
                            properties[4] = {id: "PRGLF", label: "Last Finish", formatted: lastFinish, pclass:"na"};
                            properties[5] = {id: "PRGNR", label: "Next Scheduled RunTime", formatted: nextRun, pclass:"na"};
                            properties[6] = {id: "ST", label: "Status", formatted: status, pclass: statusClass};
			properties[3].formatted = lastRun;
			if (options.update == true)
			{
                            $(properties).each(function(){
                                if($("#program" + id + this.id).length && ($("#program" + id + this.id).html() != this.formatted + "" || $("#program" + id + this.id).attr("className") != this.pclass.toString()))//If property exists and it or it's class has changed
                                {
                                    //console.log($("#program" + id + this.id).length + " program" + id + " " + this.label + "(" + this.id + ") does not match updating:'" + this.formatted + "' , Class:'" + this.pclass + "'"); console.log("Old:'" + $("#program" + id + this.id).html() + "', Class:'" + $("#program" + id + this.id).attr("className") + "'");
                                    $("#program" + id + this.id).html(this.formatted + "");//update property
                                    $("#program" + id + this.id).attr("className", this.pclass);//update class
                                }
                            });	
			}
			if (!json.name)
			{
                            json = {name:name, address: address, id:id, parentId: parentId, status: status, statusClass: statusClass, enabled:enabled, startup:startup, folder:folder, running:running, lastRun: lastRun, lastFinish:lastFinish , nextRun:nextRun, properties:properties, programs: []};
			}
			else
			{
				
                            json.programs[index] = {name:name, address: address,  id:id, parentId: parentId, status: status, statusClass: statusClass, enabled:enabled, startup:startup, folder:folder, running:running, lastRun: lastRun, lastFinish:lastFinish , nextRun:nextRun};
                            index ++;
			}
		});
		feedback('Processing program list ... (Sorting List)');
		json.programs.sort(programsSortBy);
	}
	else if ($(data).find('configuration').size())//Config *******************************************************************************************************
	{
		if (!options.template){options.template = "config";}
		json = {deviceSpecs:[],controls:[],features:[], root:{}, modules:{},
				app : $(data).find('app').text(), 
				app_version : $(data).find('app_version').text(), 
				platform : $(data).find('platform').text(), 
				build_timestamp : $(data).find('build_timestamp').text(), 
				triggers : $(data).find('triggers').text(),
				security : $(data).find('security').text(),
				isDefaultCert : $(data).find('isDefaultCert').text()
		};
		var deviceSpecs = $(data).find('deviceSpecs');
			json.deviceSpecs = {
				make : $(deviceSpecs).find('make').text(),
				manufacturerURL : $(deviceSpecs).find('manufacturerURL').text(),
				model : $(deviceSpecs).find('model').text(),
				icon : $(deviceSpecs).find('icon').text(),
				archive : $(deviceSpecs).find('archive').text(),
				chart : $(deviceSpecs).find('chart').text(),
				queryOnInit : $(deviceSpecs).find('queryOnInit').text(),
				oneNodeAtATime : $(deviceSpecs).find('oneNodeAtATime').text()
			};
		json.root = {
			id : $(data).find('root').find('id').text(),
			name : $(data).find('root').find('name').text()};
		isyName = json.root.name;updateTitle(options.url);
		json.controls = [];
		$(data).find('controls').find('control').each(function(ci){
			json.controls[ci] = {
				name : $(this).find('name').eq(0).text(),
				label : $(this).find('label').eq(0).text(),
				labelShort : labelShort($(this).find('name').eq(0).text()),
				readOnly : bool($(this).find('readOnly').text()),
				isNumeric : bool($(this).find('isNumeric').text()),
				numericUnit : $(this).find('numericUnit').text(),
				actions: []
			};
			if (json.controls[ci].name == 'CLISPC' || json.controls[ci].name == 'CLISPH' && $(this).find('actions').find('action').size() <= 0)
			{
				var ai = 0;
				var temp = 36;
				for (temp = 36; temp <= 85; temp = temp + 1) {
					json.controls[ci].actions[ai] = {name:(temp * 2),label:temp};
					ai = ai + 1;
				}
			}
			$(this).find('actions').find('action').each(function(ai){
					json.controls[ci].actions[ai] = {name : $(this).find('name').text(), label : $(this).find('label').text()};
			});
			controls[json.controls[ci].name] = json.controls[ci];//Copy controlls to a global varibile to be looked up later.
		});
		//Adds 'BRT' and 'DIM' with labels + - for use in thermostat control
		 controls['PLU'] = {
				name : 'BRT',
				label : '+',
				actions: []
			};
		controls['MIN'] = {
				name : 'DIM',
				label : '-',
				actions: []
			};
		//Adds 'DONP' control that uses DON with actions for chosing percent 
		controls['DONP'] = {
				name : 'DON',
				label : 'On',
				actions: []
			};
		var ai = 0;
		for (percent = 5; percent <= 100; percent = percent + 5) {
				controls['DONP'].actions[ai] = {name:Math.round((percent * 2.55)),label:percent + "%"};
				ai = ai + 1;
			}
                //Adds 'DONSS' speed select control that uses DON with actions for chosing fan speed 
		controls['DONSS'] = {
				name : 'DON',
				label : 'Speed',
				actions: [{name:'0',label:'Off'},{name:'63',label:'Low'},{name:'191',label:'Med'},{name:'255',label:'High'}]
			};
                //Adds 'DONH' fanlinc high
                controls['DONH'] = {
				name : 'DON',
				label : 'On',
                                action : 255,
                                actions: []
			};        
                //Controls for RCS zigbee thermostats
                controls['rcsCLISPC'] = {
				name : 'CLISPC',
				label : 'Cool Setpoint',
                                actions: []
			};  
                ai = 0;
                var temp = 60;
                for (temp = 60; temp <= 112; temp = temp + 1) {
                        controls['rcsCLISPC'].actions[ai] = {name:temp,label:temp};
                        ai = ai + 1;
                }
                controls['rcsCLISPH'] = {
				name : 'CLISPH',
				label : 'Heat Setpoint',
                                actions: []
			};  
                ai = 0;
                temp = 40;
                for (temp = 40; temp <= 90; temp = temp + 1) {
                        controls['rcsCLISPH'].actions[ai] = {name:temp,label:temp};
                        ai = ai + 1;
                }
                controls['rcsCLIMD'] = {
                    name : 'CLIMD',
                    label : 'Thermostat Mode',
                    actions: [{name:'0',label:'Off'},{name:'1',label:'Heat'},{name:'2',label:'Cool'},{name:'3',label:'Auto'}]
                }   
                controls['rcsCLIFS'] = {
                    name : 'CLIFS',
                    label : 'Fan State',
                    actions: [{name:'0',label:'Auto'},{name:'1',label:'On'}]
                }
                        
		var product = $(data).find('product');
			json.product = {
				id : $(product).find('id').text(),
				desc : $(product).find('desc').text()
			}
		json.features = [];
		json.modules = {climate : [], electricity : [], eMeter : [], eMeterSEP:[], networking : [], checkitPortal:[], greenNetPortal:[]};
		$(data).find('features').find('feature').each(function(fi){
			json.features[fi] = {id: $(this).find('id').text(),
								desc: $(this).find('desc').text(), 
								isInstalled: bool($(this).find('isInstalled').text()), 
								isAvailable: bool($(this).find('isAvailable').text())
								};
			if (json.features[fi].id == "21020")//Weather Bug Module /rest/weather
			{json.modules.climate = json.features[fi];}
			if (json.features[fi].id == "21050")//AMI Electricity Meter
			{json.modules.eMeter = json.features[fi];}
			if (json.features[fi].id == "21080")//Broadband SEP Device
			{json.modules.eMeterSEP = json.features[fi];}
               		if (json.features[fi].id == "21040")//Networking Module /rest/networking /resouces or /wol
			{json.modules.networking = json.features[fi];}
			if (json.features[fi].id == "21070")//Portal Integration - Check-it.ca
			{json.modules.checkitPortal = json.features[fi];}
			if (json.features[fi].id == "21071")//Portal Integration - GreenNet.com
			{json.modules.greennetPortal = json.features[fi];}
                        if (json.features[fi].id == "21090")//Elk Security System
			{json.modules.elk = json.features[fi];}
			//if (json.features[fi].id == "21011" || json.features[fi].id == "21010")
			//{json.modules.electricity = json.features[fi];}
                        //copy modules into global var to be accessed later
                        modules = json.modules;
		});
	}
	else if ($(data).find('climate').size())//Climate *******************************************************************************************************
	{
		json = {enabled: bool($(data).find('climate').attr('enabled')),
				locationId: $(data).find('climate').attr('locationId'),
				rss: $(data).find('climate').attr('rss'),
				properties:[]};
		var climate = $(data).find('climate')
			json.properties = [{id: 'Temperature', label: 'Temperature', formatted: $(climate).find('Temperature').text(), pclass: ""}, 
							{id: 'Temperature_High', label: 'Temperature High', formatted: $(climate).find('Temperature_High').text(), pclass: ""},
							{id: 'Temperature_Low', label: 'Temperature Low', formatted: $(climate).find('Temperature_Low').text(), pclass: ""},
							{id: 'Feels_Like', label: 'Feels Like', formatted: $(climate).find('Feels_Like').text(), pclass: ""},
							{id: 'Temperature_Rate', label: 'Temperature Rate', formatted: $(climate).find('Temperature_Rate').text(), pclass: ""},
							{id: 'Humidity', label: 'Humidity', formatted: $(climate).find('Humidity').text(), pclass: ""},
							{id: 'Humidity_Rate', label: 'Humidity Rate', formatted: $(climate).find('Humidity_Rate').text(), pclass: ""},
							{id: 'Pressure', label: 'Pressure', formatted: $(climate).find('Pressure').text(), pclass: ""},
							{id: 'Pressure_Rate', label: 'Pressure Rate', formatted: $(climate).find('Pressure_Rate').text(), pclass: ""},
							{id: 'Dew_Point', label: 'Dew Point', formatted: $(climate).find('Dew_Point').text(), pclass: ""},
							{id: 'Wind_Speed', label: 'Wind Speed', formatted: $(climate).find('Wind_Speed').text(), pclass: ""},
							{id: 'Wind_Average_Speed', label: 'Wind Average Speed', formatted: $(climate).find('Wind_Average_Speed').text(), pclass: ""},
							{id: 'Wind_Direction', label: 'Wind Direction', formatted: $(climate).find('Wind_Direction').text(), pclass: ""},
							{id: 'Wind_Average_Direction', label: 'Wind Average Direction', formatted: $(climate).find('Wind_Average_Direction').text(), pclass: ""},
							{id: 'Gust_Speed', label: 'Gust Speed', formatted: $(climate).find('Gust_Speed').text(), pclass: ""},
							{id: 'Gust_Direction', label: 'Gust Direction', formatted: $(climate).find('Gust_Direction').text(), pclass: ""},
							{id: 'Rain_Today', label: 'Rain Today', formatted: $(climate).find('Rain_Today').text(), pclass: ""},
							{id: 'Light', label: 'Light', formatted: $(climate).find('Light').text(), pclass: ""},
							{id: 'Light_Rate', label: 'Light Rate', formatted: $(climate).find('Light_Rate').text(), pclass: ""},
							{id: 'Evapotranspiration', label: 'Evapotranspiration', formatted: $(climate).find('Evapotranspiration').text(), pclass: ""},
							{id: 'Irrigation_Requirement', label: 'Irrigation Requirement', formatted: $(climate).find('Irrigation_Requirement').text(), pclass: ""},
							{id: 'Water_Deficit_Yesterday', label: 'Water Deficit Yesterday', formatted: $(climate).find('Water_Deficit_Yesterday').text(), pclass: ""}
			];
			if (options.update == true)
			{
				$(json.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						//$("#" + this.id).attr("className", this.pclass);//update pclass
					}
				});	
			}
		if(!options.template){options.template = "climate";}
	}
	else if ($(data).find('DT').size())//Time *******************************************************************************************************
	{
		var dt = $(data).find('DT')
		json = {time: format($(dt).find('NTP').text(),"time"), 
				properties:[]};
			json.properties = [{id: 'localTime', label: 'Time', formatted: format($(dt).find('NTP').text(),"time"), pclass: "na"}, 
							{id: 'TMZOffset', label: 'TMZOffset', formatted: $(dt).find('TMZOffset').text(), pclass: "na"},
							{id: 'DST', label: 'DST', formatted: $(dt).find('DST').text(), pclass: bool($(dt).find('DST').text())},
							{id: 'Lat', label: 'Lat', formatted: $(dt).find('Lat').text(), pclass: "na"},
							{id: 'Long', label: 'Long', formatted: $(dt).find('Long').text(), pclass: "na"},
							{id: 'Sunrise', label: 'Sunrise', formatted: format($(dt).find('Sunrise').text(),"time"), pclass: "na"}, 
							{id: 'Sunset', label: 'Sunset', formatted: format($(dt).find('Sunset').text(),"time"), pclass: "na"}
			];
			if (options.update == true)
			{
				$(json.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update pclass
					}
				});	
			}
		if(!options.template){options.template = "time";}
		updateUrl = options.url;
	}
	else if ($(data).find('AMIMeterSummary').size() || $(data).find('AMIMetering').size() || $(data).find('AMIPrice').size() || $(data).find('AMIMessage').size() || $(data).find('AMILoadControl').size())//eMeter *******************************************************************************************************
	{
		json = {time:false, AMIMetering:false, AMIPrice:false, AMIMessage:false, AMILoadControl:false};
		if ($(data).find('AMIMeterSummary').attr('urlBase')){eMeterUrlBase= $(data).find('AMIMeterSummary').attr('urlBase');}
		
		if ($(data).find('Time').size())
		{
			json.time = {properties:false};
			//{id: 'utcTime', label: 'UTC Time', formatted: format($(data).find('Time').find('utcTime').text() ,"time"), pclass: "na"},
			json.time.properties = [
			{id: 'localTime', label: 'Time', formatted: $(data).find('Time').attr('readable'), pclass: "na"}
			];
		}
		if ($(data).find('AMIMetering').size())
		{
			var eMeter = $(data).find('AMIMetering')
			if ($(eMeter).attr('urlBase')) {eMeterUrlBase = $(eMeter).attr('urlBase');}else{eMeterUrlBase = false;}
			json.AMIMetering = {url : eMeterUrlBase, properties: []};
				json.AMIMetering.properties = [
					{id: 'AMIMeteringStatus', label: 'Status', formatted: $(eMeter).attr('status'), pclass: "na"}, 
					{id: 'currSumDelivered', label: 'Total Utilization', formatted: kw($(eMeter).find('currSumDelivered').text()), pclass: "na"},
					{id: 'maxCurrTier1Delivered', label: 'Max Tier 1 Delivered', formatted: kw($(eMeter).find('maxCurrTier1Delivered').text()), pclass: "na"},
					{id: 'instantaneousDemand', label: 'Instantaneous Utilization', formatted: kw($(eMeter).find('instantaneousDemand').text()), pclass: "na"},
					{id: 'numPeriodsDelivered ', label: 'Number Of Periods Delivered', formatted: $(eMeter).find('numPeriodsDelivered ').text(), pclass: "na"}
				];
				if ($(eMeter).find('currSumReceived').size())
				{
					json.AMIMetering.properties = json.AMIMetering.properties.concat([
					{id: 'currSumReceived', label: 'Curr Sum Received ', formatted: kw($(eMeter).find('currSumReceived').text()), pclass: "na"},
					{id: 'maxDemandDelivered', label: 'Max Demand Delivered', formatted: kw($(eMeter).find('maxDemandDelivered').text()), pclass: "na"},
					{id: 'maxDemandReceived', label: 'maxDemandReceived', formatted: kw($(eMeter).find('maxDemandReceived').text()), pclass: "na"},
					{id: 'dftSummation', label: 'DFT Summation', formatted: $(eMeter).find('dftSummation').text(), pclass: "na"},
					{id: 'dailyFreezeTime', label: 'Daily Freeze Time', formatted: $(eMeter).find('dailyFreezeTime').text(), pclass: "na"},
					{id: 'powerFactor', label: 'PowerFactor', formatted: $(eMeter).find('powerFactor').text(), pclass: "na"},
					{id: 'readingSnapshotTime', label: 'Reading Snapshot Time', formatted: $(eMeter).find('readingSnapshotTime').text(), pclass: "na"},
					{id: 'maxDemandDeliveredTime', label: 'Max Demand Delivered Time', formatted: $(eMeter).find('maxDemandDeliveredTime').text(), pclass: "na"},
					{id: 'maxDemandReceivedTime', label: 'Max Demand Received Time', formatted: $(eMeter).find('maxDemandReceivedTime').text(), pclass: "na"},
					{id: 'currDayDelivered', label: 'Curr Day Delivered', formatted: $(eMeter).find('currDayDelivered').text(), pclass: "na"},
					{id: 'currDayReceived', label: 'Curr Day Received', formatted: $(eMeter).find('currDayReceived').text(), pclass: "na"},
					{id: 'previousDayDelivered', label: 'Previous Day Delivered', formatted: $(eMeter).find('previousDayDelivered').text(), pclass: "na"},
					{id: 'previousDayReceived', label: 'Previous Day Received', formatted: $(eMeter).find('previousDayReceived').text(), pclass: "na"},
					{id: 'currParProfileTimeDelivered', label: 'Curr Par Profile Time Delivered', formatted: $(eMeter).find('currParProfileTimeDelivered').text(), pclass: "na"},
					{id: 'currParProfileTimeReceived', label: 'Curr Par Profile Time Received', formatted: $(eMeter).find('currParProfileTimeReceived').text(), pclass: "na"},
					{id: 'currParProfileIntDelivered', label: 'Curr Par Profile Int Delivered', formatted: $(eMeter).find('currParProfileIntDelivered').text(), pclass: "na"},
					{id: 'currParProfileIntReceived', label: 'Curr Par Profile Int Received', formatted: $(eMeter).find('currParProfileIntReceived').text(), pclass: "na"}
					]);
					//console.log (json.AMIMetering.properties);
				}	
		}
		if ($(data).find('AMIPrice').size())
		{
			var price = $(data).find('AMIPrice');
			if ($(price).attr('urlBase')) {eMeterUrlBase = $(price).attr('urlBase');}else{eMeterUrlBase = false;}
			json.AMIPrice = {url : eMeterUrlBase, properties: [], controls:[]};
			var active = bool($(price).attr('active'));
			var currency = $(price).attr('currency');
			if (currency == "na"){currency = "USD";}
				json.AMIPrice.properties = [
					{id: 'priceBase', label: "Base", formatted: format($(price).find('base').text(),currency), pclass: "na"},
					{id: 'price', label: $(price).find('label').text(), formatted: format($(price).find('price').text(), currency), pclass: "na"} 
				];
				if ($(price).find('providerId').size())
				{
					json.AMIPrice.properties = json.AMIPrice.properties.concat([
					{id: 'providerId', label: "Provider Id", formatted: $(price).find('providerId').text(), pclass: "na"},
					{id: 'tier', label: "Tier", formatted: $(price).find('tier').text(), pclass: "na"},
					{id: 'startTime', label: "Start Time", formatted: $(price).find('startTime').attr('readable'), pclass: "na"},
					{id: 'AMIPriceduration', label: "Duration", formatted: format ($(price).find('duration').text(),$(price).find('duration').attr("uom")), pclass: "na"},
					{id: 'generationPrice', label: "Generation Price ", formatted: format($(price).find('generationPrice').text(),currency), pclass: "na"}
					]);
				}
			if (active)
			{options.postCode += '$(".price").show();'}
			else
			{options.postCode += '$(".price").hide();'}
		}
		if ($(data).find('AMIMessage').size())
		{
			var AMIMessage = $(data).find('AMIMessage');
			if ($(AMIMessage).attr('urlBase')) {eMeterUrlBase = $(AMIMessage).attr('urlBase');}else{eMeterUrlBase = false;}
			json.AMIMessage = {url : eMeterUrlBase, properties: [], controls:[]};
			var active = bool($(AMIMessage).attr('active'));
			var confirm = bool($(AMIMessage).find('confirm').text());
			var messageStatus = $(AMIMessage).attr('status');
			if (active && confirm && messageStatus.toLowerCase!="confirmed")
			{var messageClass = "false";}
			else {var messageClass = true;}
				json.AMIMessage.properties = [{id: 'active', label: 'Active', formatted: active, pclass: active},
					{id: 'AMIMessageStatus', label: 'Status', formatted: messageStatus, pclass: "na"},
					{id: 'confirm', label: 'Confirm', formatted: confirm, pclass: confirm},
					{id: 'message', label: 'Message', formatted: $(AMIMessage).find('message').text(), pclass: messageClass}
					];
				if ($(AMIMessage).find('startTime').size())
				{
					json.AMIMessage.properties = json.AMIMessage.properties.concat([
					{id: 'AMIMessagepriority', label: 'Priority', formatted: $(AMIMessage).find('priority').text(), pclass: "na"},
					{id: 'AMIMessageduration', label: "Duration", formatted: format ($(AMIMessage).find('duration').text(),$(AMIMessage).find('duration').attr("uom")), pclass: "na"},
					{id: 'startTime', label: 'Start Time', formatted: $(AMIMessage).find('startTime').attr('readable'), pclass: "na"},
					{id: 'Mode', label: 'Mode', formatted: $(AMIMessage).find('mode').text(), pclass: "na"}
					]);
				}	
				
				json.AMIMessage.controls = [{id:'AMIMessageConfirm',label:'confirm',url: eMeterUrlBase+'/confirm'}];
			if (active && confirm && messageStatus.toLowerCase()!="confirmed")
			{options.postCode += "$('.AMIMessageConfirm').show();"}
			else
			{options.postCode += "$('.AMIMessageConfirm').hide();"}		
		}
		if ($(data).find('AMILoadControl').size())
		{
			var AMILoadControl = $(data).find('AMILoadControl');
			if ($(AMILoadControl).attr('urlBase')) {eMeterUrlBase = $(AMILoadControl).attr('urlBase');}else{eMeterUrlBase = false;}
			json.AMILoadControl = {url : eMeterUrlBase, properties:[], controls:[]};
			var active = bool($(AMILoadControl).attr('active'));
			var stopReason = $(AMILoadControl).attr('stopReason');if (!stopReason){stopReason = "";}
			var status = $(AMILoadControl).attr('status');
			json.AMILoadControl.properties = [
				{id: 'AMILoadControlActive', label: 'Active', formatted: active, pclass: active},
				{id: 'AMILoadControlStopReason', label: 'Stop Reason', formatted: stopReason, pclass: "na"},
				{id: 'AMILoadControlStatus', label: 'Status', formatted: status, pclass: "na"},
				{id: 'criticality', label: 'Criticality', formatted: $(AMILoadControl).find('criticality').text(), pclass: "na"},
				{id: 'duration', label: 'Duration', formatted: format($(AMILoadControl).find('duration').text(),$(AMILoadControl).find('duration').attr('uom')), pclass: "na"},
				{id: 'coolingOffset', label: 'Cooling Offset', formatted: $(AMILoadControl).find('coolingOffset').text(), pclass: "na"},
				{id: 'heatingOffset', label: 'Heating Offset', formatted: $(AMILoadControl).find('heatingOffset').text(), pclass: "na"},
				{id: 'coolingSetpoint', label: 'Cooling Setpoint', formatted: $(AMILoadControl).find('coolingSetpoint').text(), pclass: "na"},
				{id: 'heatingSetpoint', label: 'Heating Setpoint', formatted: $(AMILoadControl).find('heatingSetpoint').text(), pclass: "na"},
				{id: 'avgLoadAdjustment', label: 'Avg Load Adjustment', formatted: $(AMILoadControl).find('avgLoadAdjustment').text(), pclass: "na"},
				{id: 'dutyCycle', label: 'Duty Cycle', formatted: $(AMILoadControl).find('dutyCycle').text(), pclass: "na"}
			];
			if ($(AMILoadControl).find('deviceClass').size())
			{
				json.AMILoadControl.properties = json.AMILoadControl.properties.concat([
					{id: 'deviceClass', label: 'Device Class', formatted: $(AMILoadControl).find('deviceClass').text(), pclass: "na"},
					{id: 'enrollmentGroup', label: 'Enrollment Group', formatted: $(AMILoadControl).find('enrollmentGroup').text(), pclass: "na"}
				]);
			}	
			json.AMILoadControl.controls = [{id:'AMILoadControlOptIn',label:'Opt In',url: eMeterUrlBase+'/opt_in'},
					{id:'AMILoadControlOptOut',label:'Opt Out',url: eMeterUrlBase+'/opt_out'}];
			if (active && status.toLowerCase()=="unconfirmed")
			{options.postCode += "$('.AMILoadControlOptIn').show();"
				options.postCode += "$('.AMILoadControlOptOut').show();"}
			else
			{options.postCode += "$('.AMILoadControlOptIn').hide();"
				options.postCode += "$('.AMILoadControlOptOut').hide();"}		
		}
		
			if (options.update == true)
			{
				$(json.time.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update class
					}
				});
				$(json.AMIMetering.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update class
					}
				});	
				$(json.AMIPrice.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update class
					}
					if($("#label" + this.id).html() != this.label + "")//If property has changed
					{
						$("#label" + this.id).html(this.label + "");//update property label
						//$("#" + this.id).attr("className", this.pclass);//update class
					}
				});	
				$(json.AMIMessage.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update class
					}
				});
				$(json.AMILoadControl.properties).each(function(){
					if($("#" + this.id).html() != this.formatted + "")//If property has changed
					{
						$("#" + this.id).html(this.formatted + "");//update property
						$("#" + this.id).attr("className", this.pclass);//update class
					}
				});	
			}
		if(!options.template){options.template = "eMeter";}
		updateUrl = options.url;
	}
	else if ($(data).find('AMIData').size())
	{
		var chartUsed = [];var chartDelivered = [];
		var chartYUsed = [];var chartYDelivered = [];
		//chartData[0] = [0,0];
		//chartData[1] = [1,50];
		//chartData = [[0, 0], [1, 1]];
		$(data).find('Month').find('Day').each(function(iDay){
			chartUsed[iDay] = [iDay,parseFloat($(this).attr('usage'))/1000];
			chartDelivered[iDay] = [iDay,parseFloat($(this).attr('delivered'))/1000];
		});
		//console.log(chartData);
		//options.postCode += '$.plot($("#chartMonth"), [chartUsed, chartDelivered]);';
		options.postCode += '$.plot($("#chartMonth"),[{label: "Used", data:chartUsed},{label: "Delivered", data: chartDelivered}]);';
		
		$(data).find('Year').find('Month').each(function(iMonth){
			chartYUsed[iMonth] = [iMonth,parseFloat($(this).attr('usage'))/1000];
			chartYDelivered[iMonth] = [iMonth,parseFloat($(this).attr('delivered'))/1000];
		});
		//console.log(chartData);
		//options.postCode += '$.plot($("#chartYear"), [chartYUsed, chartYDelivered]);';
		options.postCode += '$.plot($("#chartYear"),[{label: "Used", data:chartYUsed},{label: "Delivered", data: chartYDelivered}]);';
		  
		
		
		if(!options.template){options.template = "eMeterChart";}
		updateUrl = options.url;
	}
	else if ($(data).find('NetConfig').size())//Networking *******************************************************************************************************
	{
		json = [];
		$(data).find('NetRule').each(function(i)
		{	
			json[i] = {
				name: $(this).find('name').text(),
				id: $(this).find('id').text(),
				mac: $(this).find('mac').text(),
				subnet: $(this).find('subnet').text(),
				password: $(this).find('password').text(),
				controlInfo : []};
		});
		var controlInfo = $(data).find('ControlInfo');
		if (controlInfo)
		{
			json.controlInfo = {
				mode: $(controlInfo).find('mode').text(),
				protocol: $(controlInfo).find('protocol').text(),
				host: $(controlInfo).find('host').text(),
				port: $(controlInfo).find('port').text(),
				timeout: $(controlInfo).find('timeout').text(),
				method: $(controlInfo).find('method').text(),
				encodeURLs: $(controlInfo).find('encodeURLs').text()
			};
		}
		if(!options.template){options.template = "netConfig";}
	}
        else if ($(data).find('CList').size())//Variable Definition /vars/definitions/<var-type> *******************************************************************************************************
        {
            if(!options.template){
                options.template = "vars";
            }
            json = [];
            type = $(data).find('CList').attr("type");
            var typeN = 1;
            if (options.url == "/vars/definitions/2/"||options.url == "/vars/definitions/2/")
                {typeN = 2;}

            $(data).find('CList').find('e').each(function(i)
            {
                var name = $(this).attr('name');
                var id = $(this).attr('id');
                //json[i] = {name: "name"};
                json[i] = {name:name, id:id, type:type, typeN:typeN};
            });
	}
        else if ($(data).find('vars').size())//Variable Properties /vars/get/<var-type> *******************************************************************************************************
        {
            options.update = true;
            json = [];
            $(data).find('var').each(function(i)
            {
                type = $(this).attr('type');
                var id = $(this).attr('id');
                var init = $(this).find('init').text();
                var val = $(this).find('val').text();
                var ts = $(this).find('ts').text();

                json[i] = {
                    name: $(this).find('name').text(),
                    id: $(this).find('id').text()
                };
                var properties = [];
                properties[0] = {
                    id: "VARVAL",
                    label: "value",
                    formatted: val,
                    pclass:bool(val)
                };
                properties[1] = {
                    id: "VARINIT",
                    label: "Init Value",
                    formatted: init,
                    pclass:bool(init)
                };
                properties[2] = {
                    id: "VARTS",
                    label: "Time Stamp",
                    formatted: ts,
                    pclass: "na"
                    };
                $(properties).each(function(){
                    if($("#var" + type + "_" + id + this.id).html() != this.formatted + "")//If property has changed
                    {
                        $("#var" + type + "_" + id + this.id).html(this.formatted + "");//update property
                        $("#var" + type + "_" + id + this.id).attr("className", this.id + " " + this.pclass);//update class
                    }
                });

            });
	}
        else if ($(data).find('topology').size())//ELK Topology /elk/get/topology or /elk/refresh/topology *******************************************************************************************************
        {
            if(!options.template){
                options.template = "elkTopology";
            }
            json = {areas:[],tstats:[],outputs:[],audio:[]};
            var AlarmDefValues = ["Disabled", "Burglar Entry Exit 1", "Burglar Entry Exit 2", "Burglar Perimeter Instant", "Burglar Interior", "Burglar Interior Follower", "Burglar Interior Night", "Burglar Interior Night Delay", "Burglar 24 Hour", "Burglar Box Tamper", "Fire Alarm", "Fire Verified", "Fire Supervisory", "Aux Alarm 1", "Aux Alarm 2", "Keyfob", "Non alarm", "Carbon Monoxide", "Emergency Alarm", "Freeze Alarm", "Gas Alarm", "Heat Alarm", "Medical Alarm", "Police Alarm", "Police No Indication", "Water Alarm", "Key Momentary Arm/Disarm", "Key Momentary Arm Away", "Key Momentary Arm Stay", "Key Momentary Disarm", "Key On/Off", "Mute Audibles", "Power Supervisory", "Temperature", "Analog Zone", "Phone Key", "Intercom Key"];
            $($(data).find('areas').find('area')).each(function(a)
            {
                var name = $(this).attr('name');
                var id = $(this).attr('id');
                json.areas[a] = {name:name, id:id, zones:[], keypads:[]};
                $(this).find('zone').each(function(z)
                {
                    var name = $(this).attr('name');
                    var id = $(this).attr('id');
                    var alarmDefRaw = $(this).attr('alarmDef');
                    var alarmDef = AlarmDefValues[alarmDefRaw];
                    json.areas[a].zones[z] = {name:name, id:id,alarmDef:alarmDef,alarmDefRaw:alarmDefRaw};
                });
                $(this).find('keypad').each(function(k)//read keypads for each area
                {
                    var name = $(this).attr('name');
                    var id = $(this).attr('id');
                    json.areas[a].keypads[k] = {name:name, id:id, keys:[]};
                    $(this).find('key').each(function(k2)
                    {
                        var name = $(this).attr('name');
                        var id = $(this).attr('id');
                        json.areas[a].keypads[k].keys[k2] = {name:name, id:id};
                    });    
                });
            });
            $(data).find('tstats').find('tstat').each(function(t)//read thermostats from topology
            {
                var name = $(this).attr('name');
                var id = $(this).attr('id');
                json.tstats[t] = {name:name, id:id};    
            });
            $(data).find('outputs').find('output').each(function(o)//read outputs from topology
            {
                var name = $(this).attr('name');
                var id = $(this).attr('id');
                json.outputs[o] = {name:name, id:id};    
            });
            //console.log(json);
	}
        else if ($(data).find('status').size() && options.url.indexOf("/elk/") >= 0 && options.url.indexOf("/get/status") >= 0)//Elk status /elk/get/status or /elk/system/get/status *******************************************************************************************************
        {
            options.update = true;
            json = [];
            var properties = [];
            //get the status/properties of areas
            var AlarmState = ["No Alarm Active","Entrance Delay Active","Alarm Abort Delay Active","Fire Alarm","Medical Alarm","Police Alarm", "Burglar Alarm", "Aux 1 Alarm", "Aux 2 Alarm", "Aux 3 Alarm", "Aux 4 Alarm", "Carbon Monoxide Alarm", "Emergency Alarm", "Freezer Alarm", "Gas Alarm", "Heat Alarm", "Water Alarm", "Fire Supervisory", "Verify Fire"];
            var ArmUpState = ["Not Ready To Arm", "Ready To Arm", "Ready To Arm w/ Zone Violated", "Armed with Exit Timer", "Armed Fully", "Force Armed w/ Zone Violated", "Armed with Bypass"];
            var ArmedState = ["Disarmed", "Armed Away", "Armed Stay", "Armed Stay Instant", "Armed Night", "Armed Night Instant", "Armed Vacation"];
            $(data).find('ae').each(function(i)
            {
                var type = $(this).attr('type');
                var area = $(this).attr('area');
                var val = $(this).attr('val');
                var formatted = val;
                var id = type;
                var pclass="normal";
                switch (type){//convert values into readable text
                    case "1"://AlarmState
                        id="AlarmState";
                        formatted = AlarmState[val];
                        if (val != 0)//if Alarm state is anything but No Alarm Active consider it a warning
                            {pclass="warning";}
                    break;
                    case "2":
                        id="ArmUpState";
                        formatted = ArmUpState[val];
                        if (val != 1)//if Arm Up State is anthing but Ready to Arm consider it a warning
                            {pclass="warning";}
                    break;
                    case "3":
                        id="ArmedState";
                        formatted = ArmedState[val];
                        if (val != 0)//if Armed State is anthing but Disarmed consider it a warning
                            {pclass="warning";}
                    break;
                }
                //console.log("#ae" + area + "_" + id, $("#ae" + area + "_" + id).size(),formatted);
                if($("#ae" + area + id).html() != formatted + "")//If property has changed
                {
                    $("#ae" + area + id).html(formatted + "");//update property
                    $("#ae" + area + id).attr("className", id + " " + pclass);//update class
                }
            });
            //get the status/properties of zones
            LogicalZoneState =["Normal", "Trouble", "Violated", "Bypassed"];
            PhysicalZoneState = ["Not Configured", "Open", "EOL", "Short"];
            $(data).find('ze').each(function(i)
            {
                var type = $(this).attr('type');
                var zone = $(this).attr('zone');
                var val = $(this).attr('val');
                var uom = $(this).attr('uom');
                var formatted = val;
                var id = type;
                var pclass="normal";
                switch (type){//convert values into readable text
                    case "51"://AlarmState
                        id="LogicalZoneState";
                        formatted = LogicalZoneState[val];
                        if (val != 0)//if LogicalZoneState is anything but Normal consider it a warning
                            {pclass="warning";}
                    break;
                    case "52":
                        id="PhysicalZoneState";
                        formatted = PhysicalZoneState[val];
                        //if (val != 2)//if PhysicalZoneState is anthing but ???? consider it a warning
                        //   {pclass="warning";}
                    break;
                    case "53":
                        id="ZoneVoltageState";
                        formatted = format(val,uom);
                        if (val == 0){pclass="warning"}//if we get 0 volts consider it a warning??
                        //pclass=bool(val);
                    break;
                    case "56":
                        id="ZoneTemperatureState";
                        formatted = val + "°";
                        pclass="na";
                        if (val == "-60"){val == "";formatted = "";};//hide temperatures if -60
                    break;
                }
                //console.log("type=",type,"val=",val,"formatted=",formatted);
                if($("#ze" + zone + id).html() != formatted + "")//If property has changed
                {
                    $("#ze" + zone + id).html(formatted + "");//update property
                    $("#ze" + zone + id).attr("className", id + " " + pclass);//update class
                }
            });
            //get the status/properties of keypads
            $(data).find('ke').each(function(i)
            {
                var type = $(this).attr('type');
                var keypad = $(this).attr('keypad');
                var val = $(this).attr('val');
                var formatted = val;
                var id = type;
                var pclass="normal";
                switch (type){//convert values into readable text
                    case "113":
                        id="KeypadTemperatureState";
                        formatted = val + "°";
                        pclass="na";
                        if (val == "-40"){val == "";formatted = "";};//hide temperatures if -40
                    break;
                }
                //console.log("type=",type,"val=",val,"formatted=",formatted);
                if($("#ke" + keypad + id).html() != formatted + "")//If property has changed
                {
                    $("#ke" + keypad + id).html(formatted + "");//update property
                    $("#ke" + keypad + id).attr("className", id + " " + pclass);//update class
                }
            });
            //get the status/properties of outputs
            $(data).find('oe').each(function(i)
            {
                var type = $(this).attr('type');
                var val = $(this).attr('val');
                var output = $(this).attr('output');
                var formatted = val;
                var id = type;
                var pclass="normal";
                switch (type){//convert values into readable text
                    case "121"://OutputState
                        id="ST";
                        if (val == "0"){formatted="Off";pclass="off"}else{formatted="On";pclass="on"}
                    break;
                }
                if($("#oe" + output + id).html() != formatted + "")//If property has changed
                {
                    $("#oe" + output + id).html(formatted + "");//update property
                    $("#oe" + output + id).attr("className", id + " " + pclass);//update class
                }
            });
            //get the status/properties of thermostats
            var ThermostatModeState = ["Off","Heat","Cool","Auto","Emergency Heat"];
            var ThermostatHoldState = ["Do not hold","Hold"];
            var ThermostatFanState =  ["Auto","On"];
            $(data).find('te').each(function(i)
            {
                var type = $(this).attr('type');
                var tstat = $(this).attr('tstat');
                var val = $(this).attr('val');
                var formatted = val;
                var id = type;
                var pclass="na";
                switch (type){//convert values into readable text
                    case "191":
                        id="ThermostatModeState";
                        formatted = ThermostatModeState[val];
                        pclass = formatted.toLowerCase();
                        //give the hole thermostat this mode class
                        tstatClass = "tstat te" + tstat + " " + pclass;
                        if($("#te" + tstat).attr("className") != tstatClass + "")
                        {
                            $("#te" + tstat).attr("className", tstatClass);//update class
                        }
                    break;
                    case "192":
                        id="ThermostatHoldState";
                        formatted = ThermostatHoldState[val];
                        pclass = bool(val);
                    break;
                    case "193":
                        id="ThermostatFanState";
                        formatted = ThermostatFanState[val];
                        pclass = bool(val);
                    break;
                    case "194":
                        id="ThermostatTempState";
                        formatted = val + "°";
                        pclass="na";
                    break;
                    case "195":
                        id="ThermostatHeatSetPoint";
                        formatted = val + "°";
                        pclass="na";
                    break;
                    case "196":
                        id="ThermostatCoolSetPoint";
                        formatted = val + "°";
                        pclass="na";
                    break;
                    case "197":
                        id="ThermostatHumidityState";
                        formatted = val + "%";
                        pclass="na";
                    break;
                }
                //console.log("type=",type,"val=",val,"formatted=",formatted);
                if($("#te" + tstat + id).html() != formatted + "")//If property has changed
                {
                    $("#te" + tstat + id).html(formatted + "");//update property
                    $("#te" + tstat + id).attr("className", id + " " + pclass);//update class
                }
            });
            //get system event info
            var elkClass = "elk";
            $(data).find('se').each(function(i)
            {
                var type = $(this).attr('type');
                var val = $(this).attr('val');
                var formatted = val;
                var id = type;
                var pclass="normal";
                switch (type){//convert values into readable text
                    case "156"://SystemConnectionState
                        id="SystemConnectionState";
                        if (val == "0"){formatted="Disconnected";pclass="warning"}else{formatted="Connected";pclass="normal"}
                    break;
                    case "157"://SystemConnectionState
                        id="SystemEnableState";
                        if (val == "0"){formatted="Disabled";pclass="warning"}else{formatted="Enabled";pclass="normal"}
                    break;
                }
                elkClass = elkClass + " " + formatted;//add System Status to elk class
                if($("#se" + id).size() && $("#se" + id).html() != formatted)//If property has changed
                {
                    $("#se" + id).html(formatted);//update property
                    $("#se" + id).attr("className", id + " " + pclass);//update class
                }
            });
            if ($("#elk").attr("className") != elkClass)//update elk class if it has changed
            {
                $("#elk").attr("className",elkClass);
            }
	}
        //end xml to json conversion ***************************************************************************************************
	if (options.cacheJson == true)
	{
		cache.json[options.url] = json;
		cache.options[options.url] = {target: options.target, template: options.template};
	}
    if (options.update == false && options.template && options.target) //Load and process template *************************************************
    {
		feedback('Processing ... (Loading template)');
		$(options.target).setTemplateElement(options.template);
		$(options.target).setParam("url",options.url);
                $(options.target).setParam("target",options.target);
		feedback('Processing ... (Processing template)');
		$(options.target).processTemplate(json);
		if (updateUrl && $(options.target + " .update").size() < 1)
		{
			$(options.target).append('<input type="hidden" class="update" value="' + updateUrl + '">')
		}
	}
	
	if (options.postCode)
	{
		feedback('Processing ... (Processing Post Javascript)');
		//try{
			eval(options.postCode);
		//}
		//catch(e)
		//{feedback(e.description + '<br>Processing PostCode');}
	}
        if (options.cacheHtml == true)
        {
            feedback('Caching html ... ' + options.url);
            cache.html[options.url] = $(options.target).html();
        }
	feedback('<br>');
        //load additional pages
        if (options.update == false && options.target)//if we are not updateing and we have a target area
        {
            $(options.target + ' .load').each(function(){//looks for objects with load class in the target area
                //console.log(this.value, "#" + $(this).parent().attr('id'));
                if (this.value == "update")//if load = update, update the page and delete the tag
                {
                    update(false,options.target);
                    $(this).remove();
                }
                else//else display the page in .load value using its parent as the target thus replaceing the tag
                {
                    display(this.value,"#" + $(this).parent().attr('id'));
                }
            });
        }
        if (options.fCode)
        {
            //feedback('Processing ... (Processing Final Javascript)');
            //try{
                eval(options.fCode);
            //}
            //catch(e)
            //{feedback(e.description + '<br>Processing fCode');}
        }
        return true;
}
function sortBy(a,b)//Sorts list by column specified by sortOrder varible
{
	if (a.folder == true && !b.folder){
		return -1;
	}
	else if (!a.folder && b.folder == true){
		return 1;
	}
	else if (a.cat == 5 && b.cat != 5){
		return -1;
	}
	else if (a.cat != 5 && b.cat == 5){
		return 1;
	}
	else{
		return ((a[sortOrder] > b[sortOrder])-(a[sortOrder] < b[sortOrder]));
	}
}
function programsSortBy(a,b)//Sorts list by column specified by sortOrder varible
{
	if (a.folder == true && b.folder == false){
		return -1;
	}
	else if (a.folder == false && b.folder == true){
		return 1;
	}
	else{
		return ((a[sortOrder] > b[sortOrder])-(a[sortOrder] < b[sortOrder]));
	}
	
}
function kw(string)
{
	if (string > 1000)
	{
		return ((string)/1000 + " KW")
	}
	else
	{
		return (string + " Watts")
	}
}
function format(string, uom, toFixed)
{
	if (!toFixed){toFixed=2;}//Sets the default number of decimal places for those uom that use them
	if (!string || string == "" || string == " ")
	{return "";}
	switch (uom){
	case "%/on/off":
		if (string.toLowerCase() == "on" || string.toLowerCase() == "off")
		{return string;}
		else
		{return string + "%";}
	break;
	case "%":
		return string + "%";
	case "seconds":
		return string + " Sec";
	break;

	case "minutes":
		return string + " Min";
	break;
	case "degrees":
		return string + "°";
	break;
	case "USD":
		string = string / 100;
		string = string.toFixed(toFixed) + " USD";
		return string;
	case "n/a":
	case "on/off":
		return string;
	break;
	case "time":
		var time = new Date();
		var y2k = Date.parse('1/1/2000 12:00 AM');
		var dst = false;
		
			//string = string - 3600;//Temp Workaround DST problem //4:16
		
		string = string * 1000 + y2k;//convert to milliseconds, add the number of milliseconds between 1970 and 2000;
		
		//string = Date.parse("mar 8 2009 3:00 AM");//overides the date for testing
		//string = Date.parse("nov 1 2009 1:00 AM");//overides the date for testing
				
		time.setTime(string);
		
		//Workaound DST problem
		var year = Date.parse('Jan 1 ' + time.getFullYear() + ' 12:00 AM');//Number of millisecounds for the year
		var time2 = Date.parse(time.getMonth()+1 + " " + time.getDate() + " " + time.getFullYear() + " 12:00 AM");//Number of milliseconds for the day
		
		
		//var dif = (time2 - year);//Find the diffrence between the current day and the begging of year
		//dif = dif /1000/60/60/24;//Divide out to number of days
		
		var dif = (string - time.getHours() * 60 * 60 * 1000 - time.getMinutes() * 60 * 1000 - time.getSeconds() * 1000 - year);//Find differnce between begining of this day and the begging of year
		dif = dif /1000/60/60/24;//Divide out to number of days
		
		dif = dif + "";
		if (dif.indexOf(".") > 0)//If the number of days between the first day of year to current day isn't even, has decimal point, dst is in effect
		{
			dst = true;
			//console.log('dst', dif);
		}
		//var test = new Date();test.setTime(time2); console.log(string, year,test, time, dif);
		
		if (dst == true)
		{
			string = string - 3600000;//Temp Workaround DST problem //4:16
			time.setTime(string);
		}
		var hour = time.getHours();

                var ampm = "AM";//Convert from military to standard time
		if (hour > 12){hour = hour - 12;ampm = "PM";}//anything past 12 needs 12 hours subtracted and is pm
                else if (hour == 12){ampm = "PM";}//12 hours millitary time is 12 pm
                if (hour == 0){hour = 12;}//0 hours is midnight or 12 o'clock am

		//if (hour < 10){hour = "0" + hour;}
		var min = time.getMinutes();
		if (min < 10){min = "0" + min;}
		var sec = time.getSeconds();
		if (sec < 10){sec = "0" + sec;}
		return hour + ":" + min + ":" + sec + " " + ampm;
	break;
        case "dV":
            return string / 10 + "V";
        break;
	default:
		return string;
	}
}
function bool(string)
{
	if (string){string = string.toLowerCase();}
	if (string && string == 'false' | string == 'off' | string == "idle" | string == "0")
	{
		return(false);
	}
	else
	{
		return(true);
	}
}
function labelShort (control)
{
	switch (control.toUpperCase()){
		case "CLISPC":
			return ("(C)");
		break;
		case "CLISPH":
			return ("(H)");
		break;
		default:
			return "";
	}
}
function feedback (text, type)
{
    //update feedback with new text
	$("#feedback, .feedback").html(text);
    
    //add or remove classes depending on type of feedback
    if (type == "error")
    {
        $("#feedback, .feedback").addClass("error");
    }
    else
    {
        $("#feedback.error, .feedback.error").removeClass("error");
    }
}
function getCmd (nodeId, cmd1, type)
{
	if (cmd1.indexOf('null') > 0) //if cmd contains null return without doing anything.
	{
		return 0;
	}
	if (type != "program")
	{
		var url = "/nodes/" + nodeId + "/cmd/" + cmd1;
		update(url);
	}
	else
	{
		var url = "/programs/" + nodeId + "/" + cmd1;
		update(url);	
	}
}
