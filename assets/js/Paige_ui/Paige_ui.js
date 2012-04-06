var params = new PageParams();
var header = new PaigeHeader();

/*
 * Params object, providing a deferred class for each page, allowing callback
 * functions to be added to the next page load Format:
 * "pageName":deferredObject;
 */
function PageParams() {
	this.onLoad = {};
	this.params = {};
}

PageParams.prototype.addOnLoad = function(page,callback){
	if (!this.onLoad[page]){ 
		this.onLoad[page] = $.Deferred();
	}
	this.onLoad[page].done(callback);
}

PageParams.prototype.load = function(page,args){
	if (!this.onLoad[page]){
		this.onLoad[page] = $.Deferred();
	}
	this.onLoad[page].resolve(args);
}

PageParams.prototype.show = function(){
	console.log("Params.show() is depreciated! Please remove call.");
}

PageParams.prototype.setParams = function(params,url){
	this.params[url] = params;
	localStorage['params']=JSON.stringify(this.params);
}

PageParams.prototype.getParams = function(url){
	if (typeof localStorage['params'] != "undefined"){
		this.params=JSON.parse(localStorage['params']);
	}
	if (url == null) url = $.mobile.activePage.jqmData("url");
	return this.params[url];
}

PageParams.prototype.getParam = function(key,url){
	if (typeof localStorage['params'] != "undefined"){
		this.params=JSON.parse(localStorage['params']);
	}
	if (url == null) url = $.mobile.activePage.jqmData("url");
	if (this.params && typeof this.params[url] != "undefined" && typeof this.params[url][key] != "undefined"){
		return this.params[url][key];
	} else {
		console.log("Non existent param requested:'"+key+"' url:'"+url+"'");
		return null;
	}
}

PageParams.prototype.clearParam = function(){
	if (typeof localStorage['params'] != "undefined"){
		this.params=JSON.parse(localStorage['params']);
	}
	var url = $.mobile.activePage.jqmData("url");
	if(this.params!=null)
		delete this.params[url];
	localStorage['params']=JSON.stringify(this.params);
}

function loadBundles(lang){
	console.log("loading language:"+lang);
	jQuery.i18n.properties({
		name: 'Messages',
		path: 'locale/',
		mode: 'map',
		cache : true,
		language: lang,
		callback: function(){
		}
	});
}

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" ){
        alert("false!");
        return false;  
    }else{
        console.log(d.getTime());
        return !isNaN(d.getTime());
    }
}




var unreadMsgCount = 0;
var msgFuncId = 0;
function checkMessage() {
	
	//console.log("check msg on page "+$.mobile.activePage.attr('id'));
	
	var msgs_json = demodata.getData('messages');
	//console.log(msgs_json);
	
	// find the opened collaposible Msg div
	var open_msg = [];
	$('#'+$.mobile.activePage.attr('id')+' #message_div_target').find(".msg_container").map(function(key, value) {
		if($('#'+$.mobile.activePage.attr('id')+' #message_div_target'+" #" + value.id).hasClass("ui-collapsible-collapsed")) {
			//console.log(value.id+" is closed");
		} else {
			open_msg.push(value.id);
		}
	})
	
	var msg_tmp = $("#message_div_template");

	var rfn_msgs = msg_tmp.find('#message_body_div').compile({
		'div.msg_container' : {
			'row<-' : {
				'@id' : function(ctx) {
					return "Msg_container_" + ctx.item.muuid;
				},
				'h3' : function(ctx) {
					if(ctx.item.priority == '3') {
						return "<font color=red>" + ctx.item.resource.subject + "</font>";
					} else {
						return ctx.item.resource.subject;
					}
				},
				'p' : 'row.resource.content',
				'div' : function(ctx) {
					//data-collapsed="false"
					var groupButStr = "<div data-role=\"controlgroup\" data-type=\"horizontal\">";
					if(ctx.item.module == "alarm") {
						groupButStr += "<a href=\"\" data-role=\"button\">Yes</a><a href=\"\" onclick=\"alert('NO')\" data-role=\"button\">No</a>";
					} else {
						groupButStr += "<a href=\"\" data-role=\"button\">Yes</a><a href=\"\" data-role=\"button\">No</a>";

					}
					groupButStr += "</div>";
					// dummy stiuation
					var json_members = demodata.getData('groupMembers');
					var fromUser = '';
					json_members.map(function(member) {
						if(member.uuid == ctx.item.from) {
							fromUser = member.resources.name;
						}
					});
					groupButStr += "This is message is from <b><font color=blue>" + fromUser + "</font></b>";
					groupButStr += "<a href=\"\" onclick=\"closeMessageDiv(this,'" + ctx.item.muuid + "','" + ctx.item.module + "')\" data-theme=\"z\" data-role=\"button\" data-icon=\"delete\">Close</a>";

					return groupButStr;
				},
				'@data-collapsed' : function(ctx) {
					var msg_collapsed = '';
					open_msg.map(function(item) {
						if(item == 'Msg_container_' + ctx.item.muuid) {
							msg_collapsed = "false";
							return;
						}
					})
					return msg_collapsed;
				}
			},
			filter : function(a) {
				if((a.item.priority == '2' || a.item.priority == '3') && a.item.status == '1') {
					return true;
				}
				return false;
			}
		}

	});

	var elem = $("#message_div_template").clone().attr("data-role", "");
	elem.find("#message_body_div").render(msgs_json, rfn_msgs);

	$('#'+$.mobile.activePage.attr('id')+' #message_div_target').replaceWith(elem.attr("id", "message_div_target"));
	//$("#Paige_Home").trigger("create");
	$('#'+$.mobile.activePage.attr('id')+' #message_div_target').trigger("create");
	
	msgs_json.map(function(msg) {
		if(msg.status == '1') {
			unreadMsgCount++;
		}
	});
	if(unreadMsgCount == '0') {
		$('#'+$.mobile.activePage.attr('id')+' #span_unreadMsgCount').hide();
	} else {
		$('#'+$.mobile.activePage.attr('id')+' #span_unreadMsgCount').html(unreadMsgCount);
	}
	unreadMsgCount = 0;


	// very urgent msg will directly link you to the module . eg. alarm
	
	if(skipModule($.mobile.activePage.attr('id'))){
		return;
	}
		
	msgs_json.map(function(msg) {
		if(msg.status == '1' && msg.priority == '4') {

			if(msg.module == 'alarm') {
				var alarm_flag = false;
				demodata.getData('alarm_responders').map(function(alarmRespones) {
					if(alarmRespones.alarmId == msg.moduleId) {
						alarmRespones.responses.map(function(resp) {
							if(resp.uuid == dummy_login_userId && resp.response == '3') {
								alarm_flag = true;
							}
						})
					}
				});
				if(alarm_flag) {
					clearInterval(msgFuncId);

					demodata.updateData('messages', 'muuid', msg.muuid, 'status', 3);
					changePage('/alarm/alarm1_receiver.html', {
						"alarmId" : msg.moduleId
					});
				}
			} else if(msg.module == 'delivery') {

			} else {

			}
		}
	});
}

function closeMessageDiv(msgContainer, msgId, module) {
	$('#'+$.mobile.activePage.attr('id')+' #Msg_container_' + msgId).hide();
	// update msg status after close
	demodata.updateData('messages', 'muuid', msgId, 'status', 3);
}

function skipModule(pageId){
	switch(pageId){
		case 'paige_alarms':
		case 'paige_alarm1_sender':
			return true;
		break;
		default:
			return false;
	}
}
//Paige Icon at top right in the header, leading to MessageBox, except for welcome_msg
$('#paigeButton').live('click', function(event){
	//alert($('.ui-page-active').attr('id'));
	
	if($('.ui-page-active').attr('id') == "welcome_msg"
	|| paigeSettings.conf.noMessageCenter){
		console.log("Don't go to inbox");
		return false;
	}
	else{
		changePage("/demo/My_Paige.html");
	}
});

//Needs to be global to allow easy JS access, but code is closely related to headerPage.html.
function PaigeHeader() {
	this.isInit = $.Deferred();  //Needed to prevent render from running before init is called;
	this.data = {
		title : '<img src="js/Paige_ui/images/Paige_full_icon.png" class="title_icon" />',
		backUrl : 'javascript:goHome()', //
		backIcon : 'url(js/Paige_ui/images/back_icon.png)',
		helpUrl : "help.html",
		hidden : false,
		paige : true,
		menu : true,
		back: true,
		module: "Home",
	}
	this.menu=true;
	
	this.rfn;
}

PaigeHeader.prototype.init = function(pageObj) {
	var headerObj = this;
	this.rfn = $('#paigeHeader_data').clone().attr("data-role", "header").compile({
		'#backButton@href' : 'backUrl',
		'h1' : 'title'
	});
	$('#paigeHeader,.paige_tongue,.paige_eugnot').live('click', function(event) {
		if (!headerObj.menu) return true;
		if ($(event.target).closest(".ui-btn-right").size() != 0) return true;
		if ($(event.target).closest(".ui-btn-left").size() != 0) return true;
		if ($(event.target).closest(".paige_buttons").size() != 0) return true;
		pageObj.toggle_tongue();
	});
	this.isInit.resolve();
}
PaigeHeader.prototype.render = function(options) {
	var headerObj = this;
	this.isInit.done(function(){
		var data = $.extend({},headerObj.data, options);
		var header = $('#paigeHeader');
		if(data.hidden) {
			$('#gen_container').hide();
		} else {
			var elem = $('#paigeHeader_data').clone().attr("data-role", "header").render(data, headerObj.rfn);
			elem.find('.paige_back').css('background-image',data.backIcon);
			//Allow paige button to be hidden
			elem.find('#paigeButton').toggle(data.paige);
			$('#paigeInbox').toggle(data.paige);
			
			//Allow tongue/menu to be hidden
			// Erik: seems next 2 lines are 'too much' -- it just works?
			//headerObj.menu=data.menu;
			//$(".paige_tongue").toggle(data.menu);
			
			$("#headerPage #paigeHeadBar #module_setting_button").attr('href',paigeSettings.getModule(data.module).settings.url); 
			//Allow backbutton to be hidden
			elem.find('.paige_back').toggle(data.back);
			
			header.replaceWith(elem.attr("id", "paigeHeader"));
			$('#headerPage').trigger("pagecreate");
			$('#gen_container').show();
		}		
	});
}
PaigeHeader.prototype.setMsgCount = function(number){
	var headerObj = this;
	this.isInit.done(function(){
		var msgCount=$('#paigeHeader .paige_msgCount');
		if (number == null || number == 0){
			msgCount.addClass("paige_hide");
		} else {
			msgCount.html(number).removeClass("paige_hide");
		}
	});
}

//*******************************************************



function updateSelectStyle(sel) {
	var e = $($(sel.parentNode).find('span.ui-btn-text')[0]);
	if(sel.selectedIndex < 1) {
		e.removeClass('ui-enabled');
	} else {
		e.addClass('ui-enabled');
		$(sel.parentNode).find('span.ui-li-count')[0].style.display = 'none';
	}
}

function tongueInit(onCreatePageId) {
	//Disabled, now in headerPage.html
}

function tongueToggle(event) {
		//Disabled, now in headerPage.html
}

$.extend({
	getUrlVars : function() {
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},
	getUrlVar : function(name) {
		return $.getUrlVars()[name];
	}
});
(function($) {
	/**
	 * LUDO: This function has been modified to use JQM's vMouse events
	 *
	 * jQuery vmousehold plugin - fires an event while the mouse is clicked down.
	 * Additionally, the function, when executed, is passed a single
	 * argument representing the count of times the event has been fired during
	 * this session of the mouse hold.
	 *
	 * @author Remy Sharp (leftlogic.com)
	 * @date 2006-12-15
	 * @example $("img").vmousehold(200, function(i){  })
	 * @desc Repeats firing the passed function while the mouse is clicked down
	 *
	 * @name vmousehold
	 * @type jQuery
	 * @param Number timeout The frequency to repeat the event in milliseconds
	 * @param Function fn A function to execute
	 * @cat Plugin
	 *
	 * LUDO: This function has been modified to use JQM's vMouse events
	 */

	jQuery.fn.vmousehold = function(timeout, f) {
		if(timeout && typeof timeout == 'function') {
			f = timeout;
			timeout = 100;
		}
		if(f && typeof f == 'function') {
			var timer;
			var fireStep = 0;
			return this.each(function() {
				jQuery(this).bind('vmousedown', function(event) {
					event.preventDefault();
					event.stopImmediatePropagation();
					fireStep = 1;
					var ctr = 0;
					var t = this;
					if(timer)
						clearInterval(timer);
					timer = setInterval(function() {
						ctr++;
						f.call(t, ctr);
						fireStep = 2;
					}, timeout);
				})
				clearMousehold = function(event) {
					event.preventDefault();
					event.stopImmediatePropagation();

					clearInterval(timer);
					if(fireStep == 1)
						f.call(this, 1);
					fireStep = 0;
				}

				jQuery(this).bind('mouseout', clearMousehold);
				jQuery(this).bind('vmouseup', clearMousehold);
				jQuery(this).bind('vmousecancel', clearMousehold);
				jQuery(this).bind('swipe', clearMousehold);
				jQuery(this).bind('tap', clearMousehold);
			})
		}
	}
})(jQuery);

(function($) {
	$.fn.askWheel = function(options) {

		var settings = {
			'init' : 0,
			'wrap' : true,
			'from' : 0,
			'to' : 10,
			'step' : 1,
			'onChange' : null,
			'plusText' : "+",
			'minText' : "–"
		};
		if(options) {
			$.extend(settings, options);
		};
		
		function inc(value) {
			if(value >= settings.to) {
				if(settings.wrap)
					value = settings.from;
			} else {
				value += settings.step;
			}
			return value;
		}

		function decr(value) {
			if(value <= settings.from) {
				if(settings.wrap)
					value = settings.to;
			} else {
				value -= settings.step;
			}
			return value;
		}

		return this.each(function() {
			var $this = $(this);
			var value = settings.init;
			var inputBox = false;
			function toggle_input() {
				if(!inputBox) {
					var value = $this.data('wheelValue');
					inputBox = true;
					$this.html("<input class='askWheel_input' type='number' value='" + value + "'/>").find('input').select().focus().bind('change input', function(event) {
						var value = parseInt(event.target.value);
						var checkvalue = value;
						if(checkvalue > settings.to)
							value = settings.to;
						if(checkvalue < settings.from)
							value = settings.from;
						if(value != checkvalue) {
							event.target.value = value;
						}
						$this.data('wheelValue', value);
						if(settings.onChange)
							settings.onChange(value);
						if(event.type == 'change') {
							inputBox = false;
							event.target.blur();
							$this.html(pad(value, 2));
						}
					});
				}
			}

			if($this.hasClass("askWheel_inner")) {
				$this.data('wheelValue', value).html(pad(value, 2));
			} else {
				$this.data('wheelValue', value).html(pad(value, 2)).wrap("<div class='askWheel_outer' />").before("<div class='askWheel_button askWheel_upButton'>" + settings.plusText + "</div>").after("<div class='askWheel_button askWheel_downButton'>" + settings.minText + "</div>").addClass("askWheel_inner");
				$this.bind('click', toggle_input);
				$this.prev().vmousehold(200, function() {
					var value = parseInt($this.data('wheelValue'));
					value = inc(value);
					inputBox = false;
					$this.data('wheelValue', value).html(pad(value, 2));
					if(settings.onChange)
						if (settings.onChange(value) == false) {
							value = decr(value);
							$this.data('wheelValue', value).html(pad(value, 2));
						}
				});
				$this.next().vmousehold(200, function() {
					var value = parseInt($this.data('wheelValue'));
					value = decr(value);
					inputBox = false;
					$this.data('wheelValue', value).html(pad(value, 2));
					if(settings.onChange)
						if (settings.onChange(value) == false) {
							value = inc(value);
							$this.data('wheelValue', value).html(pad(value, 2));
						}
				});
			}
			if(settings.onChange)
				settings.onChange(value);
		});
	};
})(jQuery);

(function($) {
	$.fn.paigeQ = function(options) {
		var settings = {
			question_text:"",
			answers:[], //array of {label:'',callback:function()}
			urls:false,
			close_callback:null,
		};
		if(options) {
			$.extend(settings, options);
		};
		return this.each(function(){
		      var $this = $(this);
		      var question = $("<div class='paige_question'></div>");
		      if (settings.answers.length > 0){
		    	  settings.answers.map(function(answer){
		    		  var answerObj = $("<div class='paige_answerBox'></div");
		    		  if (settings.urls){ 
		    			  answerObj.html(dataurl2string(answer.label));
		    		  } else { 
		    			  answerObj.html(answer.label);
		    		  }
		    		  answerObj.bind('click',function(event){
		    			  answer.callback();
		    			  question.remove();
		    		  });
		    		  question.append(answerObj);		    		  
		    	  });
		    	  question.wrapInner('<div class="paige_answersBox"></div>');
		      }
		      var closeButton = $("<div class='paige_closeButton ui-icon-delete ui-icon'/>").bind('click',function(event){
		    	 if (typeof settings.close_callback == "function") settings.close_callback(); 
		    	 question.remove(); 
		      });
		      var questionObj = $("<div class='paige_questionBox'/>");
    		  if (settings.urls){ 
    			  questionObj.html(dataurl2string(settings.question_text)); //should be .load but cross-domain scripting rules prevent that.....:(
    		  } else { 
    			  questionObj.html(settings.question_text);
    		  }
    		  questionObj.append(closeButton);
		      question.prepend("<div class='paige_questionLip'></div>").prepend(questionObj);
		      $this.append(question);
		})
	}
})(jQuery);

function dataurl2string(url){
	if (url){
		return decodeURIComponent(url.replace(/data:,?/,""));
	} else {
		console.log("Error, dataurl2string called with null URL");
		return "";
	}
	
}



/*for google login*/
function openPopupWindow(){
    window.open(session.appServices + "login_openid?retpath=http://" + location.host + "/login_ret.html", 'openid_popup', 'width=790,height=580');
}

function toggleCheckboxInput(checkbox) {
	$('#' + checkbox.id + "_input").textinput(checkbox.checked ? 'enable' : 'disable');
}


// format a date in dutch
var dayLabels = [ 'zon', 'maan', 'dins', 'woens', 'donder', 'vrij', 'zater' ];
var monthLabels = [ 'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december' ];
function dutchDate(stamp) {
	var date = new Date(stamp), r;
	r = (date.toString('ddMMyy') == (new Date()).toString('ddMMyy'))
		? 'vandaag' : 'op';
	r += ' ' + dayLabels[ date.getDay() ] + 'dag ' + date.toString('d') + ' ' + monthLabels[ date.getMonth() ] + ' ' + date.toString('yyyy');
	return r;
}

var imgList = [{'view':'12-eye@2x.png'},{'create':'202-add@2x.png'},{'call':'75-phone@2x.png'},{'nav':'193-location-arrow@2x.png'},{'contact':'111-user@2x.png'},
				{'avail_contact':'111-user_blue.png'},{'msg':'18-envelope@2x_48x48px.png'},{'paige':'Paige_i_icon_purple.png'},{'back':'05-arrow-west@2x.png'},{'go':'21-circle-east@2x.png'}];
localStorage['imgURLs'] = JSON.stringify(imgList);
delete imglist;


(function($) {
	$.fn.appendButtonImg = function(options) {
		var settings = {
			name:"paige",
			textsize:"large",
			position:"up"
		};
		if(options) {
			$.extend(settings, options);
		};
		
		function getImgURL(name){
			var imgList =  JSON.parse(localStorage['imgURLs']);
			var returnURL;
			imgList.map(function(obj){
				$.each(obj,function(key,element){
					if(key == name){
						returnURL =  "http://"+location.host+"/js/Paige_ui/images/"+element;
					}
				})
			})
			return returnURL;
		}
		
		var img = $('<br><img src="'+getImgURL(settings.name)+'"></img>');
		$(this).each(function(i,item){
			$(item).parent().css('text-align','center');
			$(item).css('font-size',settings.textsize);
			img.appendTo(item);
			
		})
	}
})(jQuery);

var paige_alert = function (str){
	$('<div>').paigedialog({
		mode: 'button',
		transition: 'none',
		width: '300px',
		buttonPrompt: str,
		buttons: {
			'Sluit': {
				click: function() {
					
				},
				theme: 'z',
				icon: false
			}
		}
	});
}
