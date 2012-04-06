/*
 * Paige core: session management, Paige chat, Modules/settings, tools
 *
 */
//Set the global session variables:
var session = new aSession();
var paige = new Paige();
var phoneGapAvailable = false;
var paigeSettings = new Settings();
var dataCon = new PaigeData();
var paigeUser = new PaigeUser();

var remindMe = true;
var FillProfile;
var ShowSocial;
var visitFlag = 0;
var socialFlag=0;

var d = new Date();
var dat = d.getDate();
var mon = d.getMonth() + 1;
var year = d.getFullYear();
var todayDate = dat + "/" + mon + "/" + year;

/*
 * Paige class, providing emotions, personality and conversation
 * 
 * For full features, depends on PhoneGap. (Set phoneGapAvailable to true in
 * onDeviceReady callback!)
 * 
 * API: paige.dialogBox = Jquery object paige.init(); paige.say(text,prio);
 * TODO: paige.ask(question,array of answerobjs,prio); TODO: paige should have
 * an emotions statemachine
 */
function Paige() {
	this.dialogBox = null;
	this.lastDate = null;
	this.cache;
	this.inboxQprio = 1;
}

Paige.prototype.init = function() {
	var paige = this;
	// initialize paige dialog on session
	session.addCallback("authenticator", function() {
		paige.say("Please login to access the app");
	});
	session.addCallback("login", function() {
		paige.say("Hi, welcome!");
	});
	session.addCallback("logoff", function() {
		paige.say("Bye, see you later!");
	});

	
	if(typeof paigeSettings.conf.usePaigeQ == "undefined" || paigeSettings.conf.usePaigeQ){
		this.cache = new ASKCache("getPaigeDialogs", "dialog/", null, "dialog_id",
			session);
		console.log(this.cache);
		// this.cache.setInterval(300000);
		this.cache.addRenderer("all", function(json, olddata, cache) {
			// add renderer to update msgCount box
			var count = 0;
			var priority = 4;
			// add renderer to open PaigeQ messages for all high prio dialogs
			if (json && json.length > 0) {
				$("#paigeInbox").empty();
				json.map(function(dialog) {
					if (dialog == null) {
						console.log("broken json data:", json);
						return;
					}
					// check timeout and prio
					function getAnswers(question) {
						if (question.type == "comment")
							return [];
						var result = [];
						if (question.type == "closed") {
							question.answers.map(function(answer) {
								result.push({
									label : answer.answer_text ? answer.answer_text
											: answer.text,
									callback : function() {
										paige.answerCallback(dialog, question,
												answer);
									}
								});
							});
						}
						return result;
					}
					dialog.questions.map(function(question) {
						switch (question.state) {
						case null:
						case "":
						case "NEW":
							if (dialog.priority <= paige.inboxQprio) {
								if (priority != 0) {
									priority = dialog.priority;
								}
	
								$("#paigeInbox").paigeQ({
									urls : true,
									question_text : question.question_text,
									answers : getAnswers(question),
									close_callback : function() {
										paige.closeCallback(dialog, question);
									}
								}, true);
							}
							count++;
							break;
						case "REMIND":
							// var login = localStorage["login"];
							var login = ($.cookie('login'));
							console.log("Found remind login is", login);
							if (login != null && login == "true") {
								console.log("HELLLO");
								console.log(cache);
								console.log(dialog);
								question.state = "NEW";
								cache.addElement(dialog.dialog_id, dialog);
								cache.sync();
							}
							break;
	
						case "FINISH":
							// var done = localStorage["done"];
							var done = ($.cookie('done'));
							console.log("Found finish doneprofile is", done);
							if (done != null && done == "true") {
								console.log("I have filled the profile");
								console.log(cache);
								console.log(dialog);
								question.state = "NEW";
								cache.addElement(dialog.dialog_id, dialog);
								cache.sync();
							}
							break;
						}
	
					});
				});
				// localStorage["login"]=false;
				login = false;
				// localStorage["done"]=false;
				done = false;
				
				
			}
	
			if (phoneGapAvailable) {
				if (priority == 0) {
					window.plugins.pee.notify(1, 0);
					window.plugins.webView.sendAppToFront();
				} else if (priority == 1) {
					window.plugins.pee.notify(0, count);
				}
			} else {
				paige.cache.setInterval(10000); // Since phonegap is not available
												// set it to 10 sec
				// console.log("PhoneGap is not available for Msg popup.");
			}
	
			header.setMsgCount(count);
			if (phoneGapAvailable) {
				window.plugins.pee.notify(0, count);
			}
			// add infra for parsing the URLs and doing the callbacks?
		});
		
		// this.cache.addElement("Een door Ludo bedachte UUID",{"dialog_id":"Een
		// door Ludo bedachte
		// UUID","name":"","priority":"1","questions":[{"answers":[{"answer_id":"7e7db2d9-5670-4c60-b46b-ae7b796a8656","answer_text":"data:Yes","callback":"http://www.example.com/bladibla/Yes"},{"answer_id":"19898fa9-c1ff-4e77-a66a-fdd90ce84da0","answer_text":"data:No","callback":"http://www.example.com/bladibla/No"}],"question_id":"40ef5a5f-a49e-484f-8f04-6aab837a26f4","question_text":"data:,This%20is%20an%20example%20question%2C%20showing%20the%20data%20URL%20scheme","timeout":null,"type":"closed","state":"NEW"}],"requester":"<requester>","responder":"<responder>","timeout":"1327502441","uuid":"c6b0d43b-6979-40aa-991c-c2634bfee653"});
		this.cache.render();
		// get effective Prio for each dialog
	}
	
	paigeUser.init();
}

Paige.prototype.answerCallback = function(dialog, question, answer) {
	console.log(arguments);
	// var restPath = "agents/AlarmAgent/"+alarmId+"/rpc";
	// var para = {'id':alarmId,'method':'trigger','params':'[]'};
	var callbackJson = JSON.parse(answer.callback);
	console.log(callbackJson);

	if (typeof callbackJson.toModule == "undefined") {
		var rpc_para = JSON.parse(callbackJson.params);
		var restpath = callbackJson.path;
		var para = {
			'id' : callbackJson.itemId,
			'method' : callbackJson.method,
			'params' : rpc_para
		};
		var cache = this.cache;

		$.Create(session.appServices + restpath, null, {
			method : 'POST',
			data : para,
			url : session.appServices + restpath,
			headers : {
				'X-SESSION_ID' : session.sessionKey
			},
			xhrFields : {
				withCredentials : true
			},
			cache : false,
			200 : function cb(res) {
				question.state = "SEEN";
				cache.addElement(dialog.dialog_id, dialog);
				cache.sync();
			},
			403 : function callback(res) {
				forbidden();
			}
		});
	} else {

		console.log(callbackJson.para);
		var para = JSON.parse(callbackJson.para);
		changePage(callbackJson.url, para);
		if (typeof callbackJson.changeState == "undefined") {
			question.state = "SEEN";
		} else {
			question.state = callbackJson.changeState;
		}
		this.cache.addElement(dialog.dialog_id, dialog);
		this.cache.sync();

	}

}
Paige.prototype.closeCallback = function(dialog, question) {
	question.state = "SEEN";
	this.cache.addElement(dialog.dialog_id, dialog);
	this.cache.sync();
}
Paige.prototype.startDialog = function(dialog) {
	this.cache.addElement(dialog.dialog_id, dialog);
}

Paige.PRIO_ALARM = 1;
Paige.PRIO_ALERT = 2;
Paige.PRIO_VIBRBEEP = 3;
Paige.PRIO_VIBR = 4;
Paige.PRIO_MESSAGE = 5;

Paige.prototype.say = function(text, prio) {
	var now = new Date();
	if (!prio) {
		prio = this.PRIO_MESSAGE;
	}
	if (prio >= this.PRIO_MESSAGE && this.lastDate != null
			&& now - this.lastDate < 2000) {
		window.setTimeout(function() {
			paige.say(text, prio);
		}, (2000 - (now - this.lastDate)));
		return;
	}
	this.lastDate = now;
	// TODO: Not totally tested and finished, but this is the idea of the
	// priority message function
	if (phoneGapAvailable) {
		switch (prio) {
		case Paige.PRIO_ALARM:
			// Also put the app in front, only in cases of
			// emergency like the Epi App
			startApp("nl.ask.paige.app");
			// Explicit no break;
		case Paige.PRIO_ALERT:
			// Popup alert box
			window.plugins.notification.alert(text);
			// Explicit no break;
		case Paige.PRIO_VIBRBEEP:
			// Vibrate and beep
			// console.log("beeping!");
			window.plugins.PaigeSystemNotification.beep(1);
			// alert('abc'); //debug
			// Explicit no break;
		case Paige.PRIO_VIBR:
			// Vibrate
			window.plugins.notification.vibrate(500);
			// Explicit no break;
		default:
			// do nothing more than show the message in the chatbox
		}
	}
	if (this.dialogBox) {
		$(this.dialogBox[0].firstChild).before(text + "<br>");
	}
	console.log("Paige says:" + text);
}
/*
 * Navigation support (with/without jquery mobile)
 * 
 */

function changePage(url, pageParms, jqmParams, reverse, nohisto) {
	if (nohisto) {
		location.replace(url);
		return;
	}
	if (typeof $.mobile == "undefined") {
		console.log("Hi...");
		console.trace();
		var url = "http://" + window.location.host + url;
		if (pageParms != null) {
			url += "?";
			for ( var i in pageParms) {
				if (pageParms.hasOwnProperty(i)) {
					url += i + "=" + pageParms[i] + "&";
				}
			}
		}
		window.location = url;
	} else {
		if (pageParms != null) {
			params.setParams(pageParms, url);
		}
		var options = {
			reverse: !!reverse,
			pageContainer : $("#mod_container")
		}
		if (jqmParams) {
			$.extend(options, jqmParams);
		}
		;
		$.mobile.changePage(url, options);
	}
}

function currentPage() {
	if (typeof $.mobile != "undefined"
			&& typeof $.mobile.activePage != "undefined") {
		return $.mobile.activePage.jqmData("url");
	} else {
		return window.location.pathname;
	}

}

function goHome(reverse, nohisto) {
	var homePage = paigeSettings.getModule(paigeSettings.conf.modules[0]).url;
	changePage(homePage, null, null, reverse, nohisto);
}

// called to catch device backbutton only for HomePage
function backButton() {

	if ($('.ui-page-active').attr('id') == "Paige_Home"
			|| 'javascript:history.back()' == "Paige_Home") {
		console.log($('.ui-page-active').attr('id'));
		return false;
		// BackButton.exitApp();
	} else {
		document.addEventListener('backbutton', 'javascript:history.back();',
				false); //
	}
	/*
	 * onBackKeyDown function onBackKeyDown() { //alert("back key is pressed!");
	 * window.history.back(); };
	 */

	// }, false);

	// }, false);
}
/*
 * Simple non-offline data collection
 */
function PaigeData() {

}

PaigeData.prototype.get = function(restPath, data, callback) {
	if (!session.isSession()) {
		console.log("Direct data: Info: No session available, not retrying");
		session.authenticator();
		return;
	}
	var oldKey = session.sessionKey;
	var dataCon = this;
	function forbidden() {
		if (session.sessionKey != oldKey && session.isSession()) {
			console.log("Direct data: Info: New session available, retrying");
			dataCon.get(restPath, data, callback);
		} else {
			console
					.log("Direct data: Info: Need to login at server, not retrying!");
			session.authenticator();
		}
	}

	$.Read(session.appServices + restPath, data, {
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {
			callback(res.responseText);
		},
		403 : function callback(res) {
			forbidden();
		}
	});
}

PaigeData.prototype.post = function(restPath, data, callback) {
	if (!session.isSession()) {
		console.log("Direct data: Info: No session available, not retrying");
		session.authenticator();
		return;
	}
	var oldKey = session.sessionKey;
	var dataCon = this;
	function forbidden() {
		if (session.sessionKey != oldKey && session.isSession()) {
			console.log("Direct data: Info: New session available, retrying");
			dataCon.get(restPath, data, callback);
		} else {
			console
					.log("Direct data: Info: Need to login at server, not retrying!");
			session.authenticator();
		}
	}

	$.Create(session.appServices + restPath, data, {
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {
			if (callback)
				callback(res.responseText);
		},
		403 : function callback(res) {
			forbidden();
		}
	});
}

PaigeData.prototype.put = function(restPath, data, callback) {
	if (!session.isSession()) {
		console.log("Direct data: Info: No session available, not retrying");
		session.authenticator();
		return;
	}
	var oldKey = session.sessionKey;
	var dataCon = this;
	function forbidden() {
		if (session.sessionKey != oldKey && session.isSession()) {
			console.log("Direct data: Info: New session available, retrying");
			dataCon.get(restPath, data, callback);
		} else {
			console
					.log("Direct data: Info: Need to login at server, not retrying!");
			session.authenticator();
		}
	}

	$.Update(session.appServices + restPath, data, {
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {			
			if (callback)
				callback(res.responseText);
		},
		403 : function callback(res) {
			forbidden();
		}
	});
}

PaigeData.prototype.DELETE = function(restPath, data, callback) {
	if (!session.isSession()) {
		console.log("Direct data: Info: No session available, not retrying");
		session.authenticator();
		return;
	}
	var oldKey = session.sessionKey;
	var dataCon = this;
	function forbidden() {
		if (session.sessionKey != oldKey && session.isSession()) {
			console.log("Direct data: Info: New session available, retrying");
			dataCon.get(restPath, data, callback);
		} else {
			console
					.log("Direct data: Info: Need to login at server, not retrying!");
			session.authenticator();
		}
	}

	$.Delete(session.appServices + restPath, data, {
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {			
			if (callback)
				callback(res.responseText);
		},
		403 : function callback(res) {
			forbidden();
		}
		
		
	});
}


/*
 * Session class, providing login management.
 * 
 * usefull API: session.authenticator() session.isSession()
 * session.addCallback(when, callback) session.logoff()
 * handle_session(sessionKey);
 * 
 */
function aSession(sKey) {
	this.sessionKey = localStorage["paigeSessionKey"];
	this.appServices = localStorage["paigeAppServices"];
	this.uuid = localStorage["paigeSessionUuid"];
	if (!this.appServices) {
		this.appServices = "http://localhost:8888/";
	}
	if (sKey) {
		this.setSessionKey(sKey);
	}
	this.loading = false;
	this.onAuthenticator = [];
	this.onLogin = [];
	this.onLogoff = [];
}

aSession.prototype.isSession = function() {
	return (this.sessionKey != null && this.sessionKey != "");
}

aSession.prototype.setUUID = function(uuid) {
	console.log("Setting uuid to:", uuid);
	this.uuid = uuid;
	localStorage.setItem("paigeSessionUuid", uuid);
}

aSession.prototype.setSessionKey = function(sKey) {
	this.sessionKey = sKey;
	localStorage.setItem("paigeSessionKey", sKey);
}

aSession.prototype.addCallback = function(when, callback) {
	switch (when) {
	case "authenticator":
		this.onAuthenticator = this.onAuthenticator.concat([ callback ]);
		break;
	case "login":
		this.onLogin = this.onLogin.concat([ callback ]);
		break;
	case "logoff":
		this.onLogoff = this.onLogoff.concat([ callback ]);
		break;
	default:
		console.log("Unknown session callback registered");
	}
}

aSession.prototype.authenticator = function() {
	// TODO: find a way to determine login pages in a more generic way
	function isLoginPage(page) {
		var i = page.lastIndexOf('/');
		page = page.substr(i);
		switch (page) {
			case "/login.html":
			case "/login_classic.html":
			case "/login_ret.html":
			case "/ecare/ecare_login.html":
			case "/demo/Tour.html":
			case "/demo/Tour_Msg.html":
			case "/demo/welcome_msg.html":
			case "/account/activate.html":
			case "/demo/reset_pass.html":
			case "/demo/register.html":
			case "/rszk/rszk_login.html":
				return true;
		}
		return false;
	}

	var session = this;
	if (session.loading) {
		console.log("login page locked!");
		return false;
	}
	if (!isLoginPage(currentPage())) {
		console.log("locking login page!");

		session.loading = true;
		session.onAuthenticator.map(function(func) {
			func();
		});
		session.setSessionKey("");
		loginPage = "login.html";
		if (typeof paigeSettings.conf.loginPage != "undefined") {
			loginPage = paigeSettings.conf.loginPage;
		}
		changePage(loginPage, null, {
			changeHash : false,
			role : "dialog",
			reloadPage : true
		});
	}

}
aSession.prototype.logoff = function() {
	session.onLogoff.map(function(func) {
		func();
	});

	$.xhrPool.abortAll();

	// Do serverside logout:
	$.ajax(this.appServices + "logout/", {
		headers : {
			'X-SESSION_ID' : this.sessionKey
		},
		xhrFields : {
			withCredentials : true
		}
	});
	// local cleanup:
	document.cookies = "";
	// TODO Doesn't work, cookie is on other domain!
	this.setSessionKey("");
	session.loading = false;
	// make this explicit to fix race conditions

	if (!$.cookie('remember') || $.cookie('remember') == null) {

		localStorage.clear();
	}

	if (phoneGapAvailable && window.plugins.sense) {
		window.plugins.sense.toggleMain(false, function() {
		}, function() {
		});
	}

	if (phoneGapAvailable && window.plugins.pee) {
		var successCallback = function() {
			console.log("Pee message checking stoped! ");
		}
		var failureCallback = function() {
			console
					.log("Error happend , when system try to stop Pee message checking func");
		}
		// window.plugins.pee.stopMsgService(successCallback, failureCallback);
		window.plugins.pee.unregisterC2DM();
	}
	// restart with entirely:
	//window.location = "http://" + window.location.host + "/paige.html";
	window.location = "paige.html";

	// return checkbox_value;
}
function handle_session(sessionKey, url) {// Has to be global function
	session.setSessionKey(sessionKey);
	session.onLogin.map(function(func) {
		func();
	});
	if (url) {
		changePage(url);
	} else {
		goHome();
	}
}

function receiveC2DM(type, data) {

	console.log("type:" + type);
	console.log("data:" + data);
	// alert("Received type: "+type+" data: "+data);
	if (type == "registered") {
		// store data as device registration ID
		// alert("Registered on: "+data);
		paigeUser.setData("C2DMKey", data);
		var cache = caches.getList("getPaigeDialogs")[0];
		cache.setInterval(900000); // Since we have C2DM set dialog to low
									// interval (15 min)

	} else if (type == "message") {
		// Use data to determine which Cache needs to sync right now.
		if (data == "getDialog") {
			var cache = caches.getList("getPaigeDialogs")[0];
			cache.sync();
		}
	}
}

session.addCallback("login",
		function() {
			if (!caches.exists("getPaigeUser")) {
				var cache = new ASKCache("getPaigeUser",
						"resources?tags={'uuid':'','visitFlag':'','socialFlag':'','name':''}",
						null, "uuid", session);
				var skip = false;
				
				var renderer = function(json, olddata, cache) {
					if (skip)
						return;
					if (json && json.length > 0) {
						var uuid = json[0].uuid;
						if (uuid) {
							session.setUUID(uuid);
							skip = true;
						}
					}
				}
				cache.addRenderer("all", renderer);
			}
			// paigeUser.init();

			if (phoneGapAvailable) {
				console.log("Start to checking msg from Paige app service.");
				function successCallback(result) {
					// handle result
					console.log("Phone Gap Plugin found messages : " + result);
					console.log(result);
				}
				function failureCallback(error) {
					// handle error
					console.log("Phone Gap Msg Plugin found errors: " + error);
				}

				var interval = 60000;
				// call the PhoneGap plugin
				console.log("session Key is " + session.sessionKey + " url is "
						+ session.appServices);
				var url = session.appServices.substr(0,
						session.appServices.length - 1);
				// window.plugins.pee.startMsgService(successCallback,
				// failureCallback, url,session.sessionKey, interval);
				window.plugins.pee.setCallbackC2DM('receiveC2DM');
				window.plugins.pee.registerC2DM('receiveC2DM');
			}
			// localStorage["login"]=true;

			login = true;
			console.log("Login ", login);
			console.log("value of socialFlag at login is ", socialFlag);
			console.log("value of visitFlag at login is ", visitFlag);

			//
		
		})

function sendMessage(uuid, type, prio, message) {
	console.log("sendMessage called");
	var newMessage = {
		"beenRead" : false,
		"medium" : "ASKMessage",
		"message" : message,
		"prio" : prio,
		"sender" : "ddortland@ask-cs.com",
		"type" : type
	};
	$.Update(session.appServices
			+ "network/3a073b02-2cc1-102f-8c63-005056bc7e66/members/" + uuid
			+ "/messages", null, {
		data : newMessage,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		}
	});
}

/*
 * Paige settings utilities, TODO: provide some sort of offline storage for
 * settings.
 * 
 * 
 * 
 */

function Settings() {
	this.moduleRegister = {};
	this.conf = null;
}

Settings.prototype.setConf = function(profile) {
	var sp;
	this.conf = profile;

	// set sense profile
	if (phoneGapAvailable && window.plugins.sense && profile.senseProfile
			&& (sp = senseProfiles[profile.senseProfile])) {
		$.each(sp, function(k, v) {
			window.plugins.sense.setPref(k, v, function() {
			}, function() {
				console.log("Failed to set sense setting");
			});
		});
	}
}

Settings.prototype.registerModule = function(module) {
	if (this.moduleRegister[module.label])
		console.log("Warning, module already exists, overwriting!");
	this.moduleRegister[module.label] = module;
}
Settings.prototype.getModule = function(module) {
	return this.moduleRegister[module];
}

function CreateVisit(restPath) {
	$.Create(session.appServices + restPath, null, {
		method : 'POST',
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {
			// var jsonFlag = JSON.parse(res.responseText);
			// visitFlag= jsonFlag.visitFlag;
			// console.log(jsonFlag);
		},
		403 : function callback(res) {
			forbidden();
		}
	});
}

//to set flag for social Media Profiles
function CreateSocialVisit(restPath) {
	$.Create(session.appServices + restPath, null, {
		method : 'POST',
		url : session.appServices + restPath,
		headers : {
			'X-SESSION_ID' : session.sessionKey
		},
		xhrFields : {
			withCredentials : true
		},
		cache : false,
		200 : function cb(res) {
			// var jsonFlag = JSON.parse(res.responseText);
			// socialFlag= jsonFlag.socialFlag;
			// console.log(jsonFlag);
		},
		403 : function callback(res) {
			forbidden();
		}
	});
}



/*
 * 
 * PaigeUser controlles the information about the logged in paige in the rest
 * cache
 * 
 */

function PaigeUser() {
}

PaigeUser.prototype.init = function() {
	var cache = new ASKCache("getPaigeinfo", "resources/", null, "uuid",
			session);
	// this.cache.setInterval(10000);
	cache.addRenderer('all', this.renderInfo);
}

PaigeUser.prototype.renderInfo = function(json, olddata, cache) {

	paigeUser.data = json[0];
	paigeUser.cache = cache;
}

PaigeUser.prototype.setData = function(key, value) {
	if (this.data != null) {
		this.data[key] = value;

		this.cache.addElement(this.data.uuid, this.data);
		this.cache.sync();
	}

	return false
}


/*
 * //retrieving profile data for paige registered users function getProfile(JSON
 * json) {
 * 
 * dataCon.get("resources?tags={'name':'','uuid':'', 'RealName':'',
 * 'dateOfBirth':'', 'mailAddress':'', 'phoneNumber':'', 'fbusername':''}",
 * null, function callback( //'g+username':'' jsonTxt) { //console.log(jsonTxt);
 * //console.log('am i sane?', $('#name'))
 * 
 * var json = JSON.parse(jsonTxt); //console.log(json); return json; }); }
 */



function setVisitFlag() {

	if (!paigeSettings.conf.hasTourAfterFirstLogin) {
		return;
	}

	dataCon.get("resources?tags={'visitFlag':''}", null, function callback(
			jsonTxt) {
		console.log(jsonTxt);
		var json = JSON.parse(jsonTxt);
		console.log(json);
		visitFlag = json.visitFlag;

		console.log(visitFlag);

		if (typeof visitFlag == "undefined" || visitFlag == "") {
			changePage("/demo/welcome_msg.html");
			remindMe = true;
			// FillProfile = false;
		} else if (visitFlag == 0 && remindMe == true) {
			changePage("/demo/welcome_msg.html");
			/*
			 * if(!FillProfile){ socialMedia(); }
			 */
		} else if (visitFlag == 1 || visitFlag == -1) {
			// setTimeout(function(){socialMedia();}, 5000);
			// changePage("/demo/welcome_msg.html");
			/*
			 * if (FillProfile == false && ShowSocial == true) { //||
			 * (!FillProfile && visitFlag == -1) // alert("profile hasn't been
			 * filled yet"); changePage("/demo/welcome_msg.html");
			 * setTimeout(function(){socialMedia();}, 100); } else
			 */
			if (FillProfile == true) {
				goHome();
				// changePage("/Home.html");
			}
			/*
			 * else if(FillProfile == true) { changePage("/Home.html"); }
			 */
			/*
			 * if(!FillProfile){ //alert("snow here"); socialMedia(); }
			 */
		}

	});

}
session.addCallback("login", setVisitFlag);
/*session.addCallback("onDeviceReady", function(){
	paige.say("App is launched again, device is ready");
	setVisitFlag});   //when the device is ready check for flags..*/


function setSocialFlag() {

	if (!paigeSettings.conf.hasTourAfterFirstLogin) {
		return;
	}

	dataCon.get("resources?tags={'socialFlag':''}", null, function callback(
			jsonTxt) {
		console.log(jsonTxt);
		var json = JSON.parse(jsonTxt);
		console.log(json);
		socialFlag = json.socialFlag;

		console.log(socialFlag);

		if (typeof socialFlag == "undefined" || socialFlag == "" || socialFlag == 0 ) {
			$("#Paige_Home").data("pageObj").socialMedia();	//		
			FillProfile = false;
			
		} else if (socialFlag == 1) {
			
			FillProfile == true;
				
				// changePage("/Home.html");
			}
		
		

	});

}
session.addCallback("login", setSocialFlag);
//session.addCallback("onDeviceReady", setSocialFlag);//when the device is ready check for flags.
/*
 * Module system, please register you modules in modules.js.
 * 
 * usefull API: PaigeModule.register() PaigeModule.open() //Open startpage of
 * module. PaigeModule.load() //preload pages into JQM
 * 
 * TODO: make changes to these items persistent in localStorage.
 * 
 */
function PaigeModule(label, options) {
	this.label = label;
	this.url = options['url'];
	this.icon = options['icon'];
	this.depends = options['depends'] ? options['depends'] : [];
	this.settings = options['settings'] ? options['settings'] : {};
	this.preload = options['preload'] ? options['preload'] : [];
	this.doPreload = true;
	this.loaded = false;
	this.showOnHomePage = options['showOnHomePage'] ? options['showOnHomePage']
			: false;
}

PaigeModule.prototype.register = function() {
	paigeSettings.registerModule(this);
}
PaigeModule.prototype.open = function() {
	$.mobile.changePage(this.url);
}
PaigeModule.prototype.loadPage = function(page) {
	var module = this;
	if ('#' + page != window.location.hash) {// page will be loaded through
		// paige.html
		var homePage = paigeSettings.getModule(paigeSettings.conf.modules[0]).url;
		if (page != homePage || window.location.hash != "") {// page will be
			// loaded
			// through
			// paige.html
			$.mobile.loadPage(page, {
				showLoadMsg : false
			});
		}
	}
	session.addCallback("logoff", function() {
		$("div:jqmData(url='" + page + "')").removeWithDependents();
	});
}
PaigeModule.prototype.load = function() {
	var module = this;
	if (this.loaded)
		return;
	if (typeof $.mobile == "undefined") {
		console.log("mobile not initialized, failed to preload modules");
		return;
	}
	this.loaded = true;
	this.depends.map(function(module) {
		paigeSettings.getModule(module).load();
	});
	this.preload.map(function(url) {
		module.loadPage(url);
	});
}
/*
 * Statemachine engine, featuring callbacks on state changes
 * 
 * Usefull API: getState() setState() Register callback functions for state
 * changes: callback(callback) toState(newstate,callback)
 * fromState(oldstate,callback)
 */

function StateMachine(initState, label, persistent) {
	this.currentState = initState;
	this.label = label;
	this.persistent = false;
	if (typeof persistent == "boolean") {
		this.persistent = persistent;
	}
	if (this.persistent) {
		if (typeof localStorage[this.label] != "undefined") {
			this.currentState = localStorage[this.label];
		}
		;
		localStorage[this.label] = this.currentState;
	}
	this.callbacks = null;
	// generic callbacks on all state changes
	this.toStates = {};
	// specific callbacks per newstate
	this.fromStates = {};
	// specific callbacks per oldstate
}

StateMachine.prototype.getState = function() {
	return this.currentState;
}
StateMachine.prototype.setState = function(newstate) {
	var oldstate = this.currentState;
	if (oldstate == newstate)
		return false;

	this.currentState = newstate;
	if (this.persistent) {
		localStorage[this.label] = newstate;
	}
	if (this.fromStates[oldstate] != null) {
		this.fromStates[oldstate].map(function(callback) {
			callback(newstate);
		});
	}
	if (this.callbacks != null) {
		this.callbacks.map(function(callback) {
			callback(oldstate, newstate);
		});
	}
	if (this.toStates[newstate] != null) {
		this.toStates[newstate].map(function(callback) {
			callback(oldstate);
		});
	}

	return true;
}

StateMachine.prototype.callback = function(callback) {
	if (this.callbacks != null) {
		this.callbacks = this.callbacks.concat([ callback ]);
	} else {
		this.callbacks = [ callback ];
	}
}

StateMachine.prototype.toState = function(newstate, callback) {
	if (this.toStates[newstate]) {
		this.toStates[newstate] = this.toStates[newstate].concat([ callback ]);
	} else {
		this.toStates[newstate] = [ callback ];
	}
}

StateMachine.prototype.fromState = function(oldstate, callback) {
	if (this.fromState[oldstate]) {
		this.fromState[oldstate] = this.fromState[oldstate]
				.concat([ callback ]);
	} else {
		this.fromState[oldstate] = [ callback ];
	}
}
/*
 * Utility functions, Array.map, MD5, pad
 */

if (!Array.prototype.map) {
	Array.prototype.map = function(fun /* , thisp */) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();

		var res = new Array(len);
		var thisp = arguments[1];
		for ( var i = 0; i < len; i++) {
			if (i in this)
				res[i] = fun.call(thisp, this[i], i, this);
		}

		return res;
	};
}

function createUUID() {
	var chars = '0123456789abcdef'.split('');

	var uuid = [], rnd = Math.random, r;
	uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
	uuid[14] = '4';
	// version 4

	for ( var i = 0; i < 36; i++) {
		if (!uuid[i]) {
			r = 0 | rnd() * 16;

			uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
		}
	}

	return uuid.join('');
}

var MD5 = function(string) {
	function RotateLeft(lValue, iShiftBits) {
		return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
	}

	function AddUnsigned(lX, lY) {
		var lX4, lY4, lX8, lY8, lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
	}

	function F(x, y, z) {
		return (x & y) | ((~x) & z);
	}

	function G(x, y, z) {
		return (x & z) | (y & (~z));
	}

	function H(x, y, z) {
		return (x ^ y ^ z);
	}

	function I(x, y, z) {
		return (y ^ (x | (~z)));
	}

	function FF(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	}

	function GG(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	}

	function HH(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	}

	function II(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	}

	function ConvertToWordArray(string) {
		var lWordCount;
		var lMessageLength = string.length;
		var lNumberOfWords_temp1 = lMessageLength + 8;
		var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
		var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
		var lWordArray = Array(lNumberOfWords - 1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while (lByteCount < lMessageLength) {
			lWordCount = (lByteCount - (lByteCount % 4)) / 4;
			lBytePosition = (lByteCount % 4) * 8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (string
					.charCodeAt(lByteCount) << lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount - (lByteCount % 4)) / 4;
		lBytePosition = (lByteCount % 4) * 8;
		lWordArray[lWordCount] = lWordArray[lWordCount]
				| (0x80 << lBytePosition);
		lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
		lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
		return lWordArray;
	}

	function WordToHex(lValue) {
		var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
		for (lCount = 0; lCount <= 3; lCount++) {
			lByte = (lValue >>> (lCount * 8)) & 255;
			WordToHexValue_temp = "0" + lByte.toString(16);
			WordToHexValue = WordToHexValue
					+ WordToHexValue_temp.substr(
							WordToHexValue_temp.length - 2, 2);
		}
		return WordToHexValue;
	}

	function Utf8Encode(string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";

		for ( var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}

	var x = Array();
	var k, AA, BB, CC, DD, a, b, c, d;
	var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
	var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
	var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
	var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
	string = Utf8Encode(string);
	x = ConvertToWordArray(string);
	a = 0x67452301;
	b = 0xEFCDAB89;
	c = 0x98BADCFE;
	d = 0x10325476;
	for (k = 0; k < x.length; k += 16) {
		AA = a;
		BB = b;
		CC = c;
		DD = d;
		a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
		d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
		c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
		b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
		a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
		d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
		c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
		b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
		a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
		d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
		c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
		b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
		a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
		d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
		c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
		b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
		a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
		d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
		c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
		b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
		a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
		d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
		c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
		b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
		a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
		d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
		c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
		b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
		a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
		d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
		c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
		b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
		a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
		d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
		c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
		b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
		a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
		d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
		c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
		b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
		a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
		d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
		c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
		b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
		a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
		d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
		c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
		b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
		a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
		d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
		c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
		b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
		a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
		d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
		c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
		b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
		a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
		d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
		c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
		b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
		a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
		d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
		c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
		b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
		a = AddUnsigned(a, AA);
		b = AddUnsigned(b, BB);
		c = AddUnsigned(c, CC);
		d = AddUnsigned(d, DD);
	}
	var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
	return temp.toLowerCase();
}
function pad(number, length) {

	var str = '' + number;
	while (str.length < length) {
		str = '0' + str;
	}

	return str;

}

function geo_distance(lat1, lon1, lat2, lon2) {
	return haversine(lat1, lon1, lat2, lon2);
}

function haversine(lat1, lon1, lat2, lon2) {
	var l1 = deg2rad(lat1);
	var l2 = deg2rad(lat2);
	var d1 = Math.sin((l1 - l2) / 2);
	var d2 = Math.sin(deg2rad(lon1 - lon2) / 2);
	var s = Math.sqrt((d1 * d1) + (d2 * d2 * Math.cos(l1) * Math.cos(l2)));
	return 6371000 * 2 * Math.asin(s > 1 ? 1 : s);

}

function deg2rad(deg) {
	return (deg / 180.0) * Math.PI;
}
