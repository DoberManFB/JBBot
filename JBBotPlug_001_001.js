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
	alert("Initializing JB Bot");
	jbCode.setAttribute('id', 'jbbot_code'); 
	jbCode.setAttribute('src', 'https://rawgithub.com/DoberManFB/JBBot/blob/master/JBBotPlug_001_001.js'); 
	document.body.appendChild(jbCode); 
	alert("End Of JBBot Bookmarklet. Hopefully the bot is up and running now.");
}());
*/


// Globals (kept to a bare minimum)
// var DoDebugSelfTest = true; // For debugging. Set to true for trace and debug output. Set to false for production bot


// When loaded, we will init
//window.onload = function(e){ 
$(document).ready(function() {
    initJBBot();
});

////////////////////////////////////////////////////////////////////
// initEventListeners
// Setup the callbacks for Plug events that we want to capture
//
function initJBBot() {
	alert("In initJBBot()");
	/*
	// Setup the callbacks for Plug events that we want to handle
	API.on(API.USER_JOIN, onUserJoin); 	 // Called when somebody enters the cave.
	API.on(API.USER_LEAVE, onUserLeave); // Called when somebody leaves the cave.
	API.on(API.DJ_ADVANCE, onDjAdvance); // Called when the dj booth advances to the next play.
	API.on(API.WAIT_LIST_UPDATE, onWaitListUpdate); // Called on any change to the DJ queue.
	API.on(API.CHAT, onChat); 			// Called on incomming chat
	*/
}
/*
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
// onUserJoin
// Called when somebody enters the cave. 
// Plug passes in a user object.
//
function onUserJoin(user) {
	if (user && user.username && user.username != "") {
		botSay("Hi " + user.username);
	}
}

////////////////////////////////////////////////////////////////////
// onUserLeave
// Called when somebody leaves the cave.
// Plug passes in a user object.
//
function onUserLeave(user) {
	if (user && user.username && user.username != "") {
		botSay(user.username + " has left the cave.");
	}
}

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
	wootCurrentSong();
	if (DoDebugSelfTest) {
		botSay("Self test: DJ Advance");
	}
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
// onChat
// Called when someone enters text in chat
// Plug passes a JSON object contining the following:
//    	type: <string> // "message", "emote", "moderation", "system"
//		un: <string> // the username of the sender
//		uid: <int> // the user id of the sender
//		message: <string> // the chat message
//
function onChat(chatJSON) {
	if (DoDebugSelfTest) {
		if ((chatJSON.type == "message") && (chatJSON.message.substr(0,2) == "JB") {
				botSay("@" + chatJSON.un + " I got your message, but I'm still an infant and don't yet know how to respond. :(");
		}
	}
}

////////////////////////////////////////////////////////////////////
// wootCurrentSong
// click the woot button 
function wootCurrentSong() {
    $('#button-vote-positive').click();
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
