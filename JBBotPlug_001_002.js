//////////////////////////////////////////////////
// JB Bot for the Funk & Soul Cave on Plug.DJ
// Author: DoberManFB@gmail.com
//
// Due to differences between Plug and TT, this is a complete re-write rathter than a port of the TT.FM version.
//

// Use the following code as a bookmarklet to run the bot:
/*
javascript: (function () { 
	var jbCode = document.createElement('script'); 
	jbCode.setAttribute('id', 'jbbot_code'); 
	jbCode.setAttribute('src', 'https://rawgithub.com/DoberManFB/JBBot/master/JBBotPlug_001_001.js'); 
	document.body.appendChild(jbCode); 
}());
*/


// Globals (kept to a bare minimum)
var DoDebugSelfTest = true; // For debugging. Set to true for trace and debug output. Set to false for production bot
var JBQuoteTimerCallback = null;
var IQuote = 0;
var JbQuotes = ['Haiiii!', 
				'Good God!', 
				'Gonna step back, kiss myself!', 
				'Take it to the bridge!', 
				'Shake yo\' rump to the funk!', 
				'I got ants in my pants and I need to dance!', 
				'You\'re a shining star, no matter who you are!', 
				'1.. 2.. 3.. hit it!', 
				'Fellas, I\'m ready to get up and do my thing!', 
				'I pity the fool who doesn\'t favorite this room!', 
				'I\'ll take four fried chickens and a Coke!', 
				'Give the drummer some!', 
				'Shake your money maker!', 
				'If you ain\'t gonna favorite, take your dead ass home!', 
				'What time is it?', 
				'Somebody bring me a mirror!', 
				'Funk is what time it is!', 
				'Raise up, get yourself together... drive that funky soul!', 
				'Spelunk da funk!', 
				'You gotta favorite... you know I like it!', 
				'Sounds real good in here... let\'s keep it that way!', 
				'Put your foot on the rock and don\'t stop!', 
				'Aw, yeah... this is my joint!', 
				'If you like the room, please favorite by clicking the star on the upper left, join the fb group in Room Info, and fan your fave DJs!', 
				'Lekker, Lekker, Lekker!!', 
				'Papa\'s got a brand new bot!', 
				'Get on the scene, like a sex machine!!', 
				'Funk... the final frontier!',  
				'Come on with your come-on!', 
				'Glory be to the one who knows what the funk\'s about!', 
				'I don\'t know...but whats-ever you play, it\'s got to be funky!', 
				'If you hear some funky fuss, it ain\'t nobody but us!', 
				'Que pasa, people, que pasa HIT ME!', 
				'Soul power!', 
				'Soul vaccination...everybody get in line!', 
				'We\'re gonna have a funky good time!', 
				'What you gon\' play now?', 
				'You gotta get in the bracket...you know I like it!', 
				'I don\'t know Karate But I know Ka-Razor.', 
				'Every Thing I do, Gohn be Fohnky', 
				'Funkify your life get on down, you can be the funkiest one in town.', 
				'You can\'t hold no groove, if you ain\'t got no pocket.', 
				'If you can\'t funk with the best, then bump with the rest.']; 


// Bring the bot to life
initJBBot();


////////////////////////////////////////////////////////////////////
// initJBBot
// Setup the callbacks for Plug events that we want to capture
//
function initJBBot() {
	// Setup the callbacks for Plug events that we want to handle
	API.on(API.CHAT, onChat); 			// Called on incomming chat
	API.on(API.USER_JOIN, onUserJoin); 	 // Called when somebody enters the cave.
	API.on(API.USER_LEAVE, onUserLeave); // Called when somebody leaves the cave.
	
/*	
	API.on(API.DJ_ADVANCE, onDjAdvance); // Called when the dj booth advances to the next play.
	API.on(API.WAIT_LIST_UPDATE, onWaitListUpdate); // Called on any change to the DJ queue.
*/

	botSay("Hi Cave Fam!");
}

////////////////////////////////////////////////////////////////////
// botSay
// The string passed in msg is displayed in Chat
//
function botSay(msg) {
	if (msg != "") {
		API.sendChat(msg);
	}
}

////////////////////////////////////////////////////////////////////
// botSayToUser
// The string passed in msg is displayed in Chat, with @username prepended
//
function botSayToUser(msg, username) {
	botSay("@" + username + " " + msg);
}

////////////////////////////////////////////////////////////////////
// sayQuote
// Say the next JB Quote in chat
//
function sayQuote() {
	if (IQuote >= JbQuotes.length) {
		IQuote = 0;
	}
	botSay(JbQuotes[IQuote]);
	IQuote++;
}


////////////////////////////////////////////////////////////////////
// sayQuoteSoon
// Say the next JB Quote in chat after a delay
//
function sayQuoteSoon() {
	if (JBQuoteTimerCallback != null) {
		clearTimeout(JBQuoteTimerCallback);
	}

	// Set a new quote timer
	JBQuoteTimerCallback = setTimeout( function() {
		JBQuoteTimerCallback = null;
		sayQuote();
	}, 10000); // Timer fires in 10 seconds if not cleared by a new request  
	
}

////////////////////////////////////////////////////////////////////
// onChat
// Called when someone enters text in chat
// Plug passes a JSON object contining the following:
//    	type: <string> // "message", "emote", "moderation", "system"
//		un: <string> // the username of the sender
//		uid: <int> // the user id of the sender
//		message: <string> // the chat message
//
function onChat(chatJSON) {
	if (chatJSON.type == "message") {
		var msgLower = chatJSON.message.toLowerCase();
		if (msgLower.indexOf("jb") >= 0) {
			if ((msgLower.indexOf("where") >= 0) && (msgLower.indexOf("been") >= 0)) {
				botSayToUser("Some say I was gettin busy with Betty Davis, some say I was stayin fired up on the the Mothership, some say I got trapped on an Unfunky TT.FM UFO, but this here bot-of-mystery ain't sayin.", chatJSON.un);
			}
			else if (((msgLower.indexOf("see") >= 0) && (msgLower.indexOf("again") >= 0)) || (msgLower.indexOf("back") >= 0)) {
				botSayToUser("It's been too long. Missed the Cave. Glad to be back and glad to see you again!", chatJSON.un);
			}
			else if ((msgLower.substr(0,2) == "jb") || (msgLower.substr(0,3) == "@jb")) {
				botSayToUser("I hear you, but I'm still blasted from my recent trip on the Mothership, so I dunno whatcha sayin.", chatJSON.un);
			}
			sayQuoteSoon();
		}
	}
}

////////////////////////////////////////////////////////////////////
// onUserJoin
// Called when somebody enters the cave. 
// Plug passes in a user object.
//
function onUserJoin(user) {
	if (user && user.username && user.username != "") {
		botSay("Hi @" + user.username + ". HDF is hosting tonight's Power Hour. The theme is Letter Game.");
		sayQuoteSoon();
	}
}

////////////////////////////////////////////////////////////////////
// onUserLeave
// Called when somebody leaves the cave.
// Plug passes in a user object.
//
function onUserLeave(user) {
	if (user && user.username && user.username != "") {
		sayQuoteSoon();
		botSay("Looks like " + user.username + " is outta here.");
	}
}

/*
////////////////////////////////////////////////////////////////////
// onDjAdvance
// Called when the dj booth advances to the next play.
// Plug passes in a JSON object containing:
//		a dj user object, 
// 		the current media object, 
// 		a score object, 
// 		and, if there was something playing before the advance, 
// 		the lastPlay object, which is a JSON object of the last played item.
// 
function onDjAdvance(jsonObj) {
	alert("onDjAdvance");
	wootCurrentSong();
}

////////////////////////////////////////////////////////////////////
// wootCurrentSong
// click the woot button 
function wootCurrentSong() {
	// $('#woot').click();
    // $('#button-vote-positive').click();
	alert("wootCurrentSong()");
	if (!fJBBotSpinning()) {
		document.getElementById('woot').click();
		alert("clicked woot");
	}
}

////////////////////////////////////////////////////////////////////
// fAnyoneSpinning
// returns whether or not anyone is spinning 
function fAnyoneSpinning() {
    return (typeof API.getDJ() != 'undefined');
}

////////////////////////////////////////////////////////////////////
// fBotSpinning
// returns whether or not the bot is spinning 
function fJBBotSpinning() {
    return (fAnyoneSpinning() && (API.getDJ().id == API.getUser().id));
}




////////////////////////////////////////////////////////////////////
// onWaitListUpdate
// Called when the users in the wait list change, 
// Plug passes an array of the user objects in order from beginning to last in the wait list.
// 
function onWaitListUpdate(rgUsers) {
	if (DoDebugSelfTest) {
		var msg = "DJ Queue: " + ((rgUsers.length < 1) ? "Empty." : "");
		for (var i = 0; i < rgUsers.length; i++) {
			msg += rgUsers[i].username;
		}
		botSay(msg);
	}
}

	
////////////////////////////////////////////////////////////////////
// fJBBotOnWaitlist
// returns whether or not the bot is spinning 
function fJBBotOnWaitlist() {
    return (API.getWiatListPosition(API.getUser().id) >= 0);
}


////////////////////////////////////////////////////////////////////
// jumpUp
// hop on deck or queue up
function jumpUp() {
	if (!fJBBotSpinning() && !fJBBotOnWaitlist()) {
		API.djJoin();
	}
}

////////////////////////////////////////////////////////////////////
// jumpDown
// hop off deck or out of the queue
function jumpDown() {
	if (fJBBotSpinning() || fJBBotOnWaitlist()) {
		API.djLeave();
	}
}
*/
