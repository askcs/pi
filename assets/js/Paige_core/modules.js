var paigeProfiles = { // Some preset profiles
		"default" : {
			modules : ["Home","Ecare","States","Alarm","Teams","Messages","Tasks","Appointments","IsParaat","Deal Recipient","Deal Deliverer"],
			chatBox : true,
			css:"/js/Paige_ui/Paige.css",
			hasTour: true,
			hasGoogleLogIn:true,
			hasRegister:true,
			hasTourAfterFirstLogin:true,
			hasLoginOptions: true,
			usePaigeQ: true,
		},
		"isParaat" : {
			modules : ["IsParaat"],
			chatBox : false,
			css:"/js/Paige_ui/Paige.css",
			demodata: false,
		},
		"knrm" : {
			modules : ["KNRM"],
			css:"/js/Paige_ui/Paige.css",
			chatBox : false,
			demodata: false,
			hasTour: true,
			hasGoogleLogIn:true,
			hasTourAfterFirstLogin:true,
			hasLoginOptions: true,
		},
		"Ecare" : {
			modules : ["Ecare"],
			chatBox : false,
			loginPage: "/ecare/ecare_login.html",
			css:"/js/Paige_ui/ECare.css",
			usePaigeQ: false,
			lang: "nl",
		},
		"Deal Recipient" : {
			modules : ["Deal Recipient"],
			chatBox	: false,
			css:"/js/Paige_ui/Paige.css",
			/*hasGoogleLogIn:false,
			hasRegister:false,
			hasTour:false,*/
			hasGoogleLogIn:false,
			hasLoginOptions: true,
			usePaigeQ: true,
		},
		"Deal Deliverer" : {
			modules : ["Deal Deliverer"],
			chatBox	: false, 
			css:"/js/Paige_ui/Paige.css",
			hasGoogleLogIn:true,
			hasLoginOptions: true,
			usePaigeQ: true,
		},
		"demo" : {
			modules : ["Demo"],
			chatBox	: false,
			css:"/js/Paige_ui/Paige.css",
			demodata: false,
			hasTour: true,
			hasGoogleLogIn:true,
			hasTourAfterFirstLogin:true,
			hasLoginOptions: true,
			usePaigeQ: true,
		},
		"RSZK" : {
			modules : ["RSZK"],
			chatBox : false,
			loginPage: "/rszk/rszk_login.html",
			css:"/js/Paige_ui/RSZK.css",
			hasTour: false
		},
		"SlimVerbinden" : {
			modules : ["SlimVerbinden"],
			css:"/js/Paige_ui/Paige.css",
			chatBox: false,
			demodata: false
		},
		"alarm" : {
			modules : ["Alarm"],
			chatBox	: false,
			css:"/js/Paige_ui/Paige.css",
			demodata: false,
			hasLoginOptions: true,
		},
		'paige@office': {
			modules: ['States'],
			css:"/js/Paige_ui/Paige.css",
			senseProfile: 'default',
			hasTour: true,
			hasGoogleLogIn:true,
			hasTourAfterFirstLogin:true,
			hasLoginOptions: true,
		},
		'Moodie': {
			modules: ['Moodie'],
			css:"js/Paige_ui/Paige.css",
			senseProfile: 'default', // ?
			logo: 'images/Logo.png',
			hasTour: false,
			hasGoogleLogIn:false,
			hasTourAfterFirstLogin:false,
			hasLoginOptions: true,
			noMessageCenter: true
		},
		
};

var senseProfiles = {
// TODO this list still up to date?
	'default': {
		commonSense_Rate:			'0',
		sync_Rate:					'1',
		use_CommonSense:			true,
		devMode:					false,
		compression:				true,
		
		// Location
		location_GPS:				true,
		location_Network:			true,
		automatic_GPS:				true,
		// Motion
		motion_Fall_detector:		false,
		motion_Energy:				true,
		motion_Unregister:			true,
		motion_ScreenOff_Fix:		false,
		// Ambience
		ambience_Mic:				true,
		ambience_Light:				false,
		// Peers
		proximity_BT:				true,
		proximity_WiFi:				false
	}
};


function loadModules(){
	
	new PaigeModule("Home",{
		url:"/Home.html",
		icon:null,
		depends:["States","Settings"],
		settings:{url:"/demo/settingsMenu.html"},
		preload:["/Home.html"],
	}).register();
	
	new PaigeModule("Settings",{
		url:"/settings.html",
		icon:"js/images/glyphish/icons/157-wrench.png",
		depends:[],
		settings:{},
		preload:["/settings.html"],
		showOnHomePage:false,
	}).register();
	
	new PaigeModule("Presets",{
		url:"/presets.html",
		icon:"js/images/glyphish/icons/157-wrench.png",
		depends:[],
		settings:{},
		preload:["/presets.html","/config.html"],
		showOnHomePage:false,		
	}).register();
	
	new PaigeModule("States",{
		url:"/states/states.html",
		icon:"js/images/glyphish/icons/83-calendar.png",
		depends:[],
		settings:{},
		preload:["/states/states.html"],
		showOnHomePage:true
	}).register();
	
	new PaigeModule("Group",{
		url:"/group/groups.html",
		icon:null,
		depends:[],
		settings:{url:"/group/groups_edit.html"},
		preload:["/group/groups.html"],
	}).register();

	new PaigeModule("Messages",{
		url:"/messages.html",
		icon:"js/images/glyphish/icons/40-inbox.png",
		depends:[],
		settings:{},
		preload:["/messages.html"],
		showOnHomePage:true,
	}).register();

	new PaigeModule("Alarm",{
		url:"/alarm/alarmII.html",
		icon:"js/images/glyphish/icons/10-medical.png",
		depends:['Group'],
		settings:{url:"/alarm/alarm_request.html"},
		//preload:["/alarm/alarmII.html"],
		preload:["/alarm/alarm.html"],
		showOnHomePage:true,
	}).register();

	new PaigeModule("Tasks",{
		url:"/tasks.html",
		icon:"js/images/glyphish/icons/117-todo.png",
		depends:[],
		settings:{},
		preload:["/tasks.html"],
		showOnHomePage:true,
	}).register();
/*
	new PaigeModule("Deliveries",{
		url:"/deliveries.html",
		icon:"js/images/glyphish/icons/24-gift.png",
		depends:[],
		settings:{},
		preload:["/deliveries.html"],
		showOnHomePage:true,
	}).register();
*/
	new PaigeModule("Appointments",{
		url:"/appointments.html",
		icon:"js/images/glyphish/icons/83-calendar.png",
		depends:[],
		settings:{},
		preload:["/appointments.html"],
		showOnHomePage:true,
	}).register();
	
	new PaigeModule("IsParaat",{
		url:"/isParaat/isParaat.html",
		icon:"js/images/glyphish/icons/90-life-buoy.png",
		depends:["States", "Teams" ],
		settings:{},
		preload:["/isParaat/isParaat.html"],
		showOnHomePage:true,
	}).register();

	new PaigeModule("KNRM",{
		url:"/KNRM/knrm.html",
		icon:"js/images/glyphish/icons/90-life-buoy.png",
		depends:["States"],
		settings:{},
		preload:["/KNRM/knrm.html","/KNRM/teams.html", "/KNRM/teamMembers.html", "/KNRM/person.html"],
	}).register();
	
	new PaigeModule("Ecare",{
		url:"/ecare/ecare.html",
		icon:"js/images/glyphish/icons/90-life-buoy.png",
		depends:[ ],
		settings:{},
		preload:["/ecare/ecare.html","/ecare/ecare_client.html","/ecare/ecare_reports.html","/ecare/ecare_appointment.html","/ecare/ecare_checkout.html","/config.html","/ecare/ecare_contact.html"],
		showOnHomePage:true,
	}).register();
	
	new PaigeModule("Deal Recipient",{
		url:"/order/orders.html",
		icon:"js/images/glyphish/icons/24-gift.png",
		depends:[ ],
		settings:{},
		preload:["/order/orders.html"],
		showOnHomePage:true,
	}).register();
	
	new PaigeModule("Deal Deliverer",{
		url:"/deliveries/deliveries.html",
		icon:"js/images/glyphish/icons/24-gift.png",
		depends:[ ],
		settings:{},
		preload:["/deliveries/deliveries.html"],
		showOnHomePage:true,
	}).register();
	
	new PaigeModule("Demo",{
		url:"/Home.html",
		icon:null,
		depends:["Group"],
		settings:{},
		//preload:["/Home.html","/group/groups.html","/group/group_members.html"],
		preload:["/alarm/alarm.html"], // instead of welcome_msg.html 
		
	}).register();
	
	new PaigeModule("RSZK",{
		url:"/rszk/rszk.html",
		icon:null,
		depends:[],
		settings:{},
		preload:["/rszk/rszk.html","/rszk/rszk_appointments.html"], // instead of welcome_msg.html 
		showOnHomePage:true
	}).register();

	new PaigeModule("SlimVerbinden",{
		url:"/SlimVerbinden.html",
		icon:null,
		depends:["Settings"],
		settings:{},
		//preload:["/Home.html","/group/groups.html","/group/group_members.html"],
		preload:[], // instead of welcome_msg.html 
	}).register();
	
	new PaigeModule("Moodie",{
		url:"moodie.html",
		icon:null, //?
		depends:[],
		settings:{},
		preload:[/*"moodie.html","emotion.html","recent.html","rhythm.html","substances.html","time.html"*/], // instead of welcome_msg.html 
		showOnHomePage:false
	}).register();
	
}
loadModules();

