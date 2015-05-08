//////////////////////////////////////////////////
// JB Bot for the Funk & Soul Cave on Plug.DJ
// Author: DoberManFB
//
// Due to differences between Plug and TT, this is a complete re-write rathter than a port of the TT.FM version.
//

// Use the following code as a bookmarklet to run the bot:
/*
javascript: (function () { 
	var jbCode = document.createElement('script'); 
	jbCode.setAttribute('id', 'jbbot_code'); 
	jbCode.setAttribute('src', 'https://rawgithub.com/DoberManFB/JBBot/master/JBBotPlug_001_004.js'); 
	document.body.appendChild(jbCode); 
}());
*/


// Globals
var DoDebugSelfTest = true; // For debugging. Set to true for trace and debug output. Set to false for production bot

var JBBotUsername = API.getUser().usrename;
var brbList = [];    // list of people who said they will be right back
var noChatList = []; // list of people who said they are not available to chat
var themeCur = ""; // PH theme, or temporary theme set when not on a PH

// Variables for built-in quotes
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

// *****************************************************************
// Output Utility Functions
//
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


// *****************************************************************
// Security/Role utiltities
//
////////////////////////////////////////////////////////////////////
// getUserRole
// return the role of the user, as in integer from 0-5:
//    0 No Cave role
//    1 Resident DJ
//    2 Bouncer
//    3 Manager
//    4 Co-Host
//    5 Host
function getUserRole(userID) {
	return API.getUser(userID).role;
}

////////////////////////////////////////////////////////////////////
// fIsCaveStaff
// return true if the userID matches one of the cave staff members
function fIsCaveStaff(userID) {
	return (getUserRole(userID) > 1);
}


// *****************************************************************
// Event Processing Callback Functions
//
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

	var username = chatJSON.un;
	
	// only handle actual messages and only ones that are NOT from the bot
	if ((chatJSON.type == "message") && (username != JBBotUsername)) {
		var userID = chatJSON.uid;
		var msg = chatJSON.message;
		var msgLower = msg.toLowerCase();
		
		handleBRBonChat(msgLower, username); // Handle Be Right Back stuff
		handleNoChatOnChat(msgLower, username); // Handle Be Right Back stuff

		if (!fProcessBotCommands(msg, username, userID)) {
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
}

////////////////////////////////////////////////////////////////////
// onUserJoin
// Called when somebody enters the cave. 
// Plug passes in a user object.
//
function onUserJoin(user) {
	if (user && user.username && user.username != "") {
		var szOut = 'Hi @' + user.username + '.';
		
		// If we are running a theme, tell the user who just enterd what theme is running.
		if (fHaveTheme()) {
			szOut += ' We are spinning songs on theme: "' + themeCur + '"';
		}
		
		botSay(szOut);
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

// *****************************************************************
// Bot Quote Functions
//
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


// *****************************************************************
// NoChat Functions
//
////////////////////////////////////////////////////////////////////
// addNoChat
// Add user specified by username to the No Chat list
function addNoChat(username) {
	if (noChatList.indexOf(username) == -1) {
		noChatList.push(username);
	}
}

////////////////////////////////////////////////////////////////////
// removeNoChat
// Remove user specified by username from the No Chat list
function removeNoChat(username) {
	var i = noChatList.indexOf(username);
	if (i >= 0) {
		noChatList.splice(i, 1); 
	}
}

////////////////////////////////////////////////////////////////////
// sayNoChatList
// Say in chat the list of users on the No Chat list
function sayNoChatList() {
	botSay((noChatList.length > 0) ? 'No Chat List: ' + noChatList.join(', ') : 'The No Chat List is empty.');
}

////////////////////////////////////////////////////////////////////
// clearNoChatList
// Empty the No Chat list. Only Cave Staff can do this.
function clearNoChatList(username, userID) {
	if (fIsCaveStaff(userID)) {
		noChatList.length = 0;
		botSayToUser('No Chat List cleared', username); 	
	}
	else {
		botSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the No Chat List.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// handleNoChatOnChat
// When a user speaks in chat, remove them from the Be Right Back list
// If someone speaks to a user who is on the BRB list, let them know that the user is
// not available to chat.
function handleNoChatOnChat(msg, username) {
	var msgLower = msg.toLowerCase();

	removeBRB(username); // as soon as a user chats, [s]he is back from BRB
	

	for (var i = 0; i < noChatList.length; i++) {
		// If someone mentions a No Chat user, tell them the user is not available for chat
		if (msgLower.indexOf(noChatList[i].toLowerCase()) != -1) {
			botSayToUser(noChatList[i] + ' can\'t chat right now.', username); 
		}
		
		// If someone on the No Chat list is chatting, warn them that they are on the no chat list.
		if (username == noChatList[i]) {
			botSayToUser(' you are listed as being unable to chat. You can remove yourself from the no chat list by saying yeschat or chat+ or c+', username); 
		}
	}
}


// *****************************************************************
// BRB (Be Right Back) Functions
//
////////////////////////////////////////////////////////////////////
// addBRB
// Add user specified by username to the Be Right Back list
function addBRB(username) {
	if (brbList.indexOf(username) == -1) {
		brbList.push(username);
	}
}

////////////////////////////////////////////////////////////////////
// removeBRB
// Remove user specified by username from the Be Right Back list
function removeBRB(username) {
	var i = brbList.indexOf(username);
	if (i >= 0) {
		brbList.splice(i, 1); 
	}
}

////////////////////////////////////////////////////////////////////
// sayBRBList
// Say in chat the list of users on the Be Right Back list
function sayBRBList() {
	botSay((brbList.length > 0) ? 'Be Right Back List: ' + brbList.join(', ') : 'The Be Right Back List is empty.');
}

////////////////////////////////////////////////////////////////////
// clearBRBList
// Empty the BRB list. Only Cave Staff can do this.
function clearBRBList(username, userID) {
	if (fIsCaveStaff(userID)) {
		brbList.length = 0;
		botSayToUser('BRB list cleared', username); 	
	}
	else {
		botSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the Be Right Back List.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// handleBRBonChat
// When a user speaks in chat, remove them from the Be Right Back list
// If someone speaks to a user who is on the BRB list, let them know that the user is
// not available to chat.
function handleBRBonChat(msg, username) {
	var msgLower = msg.toLowerCase();

	removeBRB(username); // as soon as a user chats, [s]he is back from BRB
	
	// If someone mentions a Be Right Back user, tell them the user is away
	for (var i = 0; i < brbList.length; i++) {
		if (msgLower.indexOf(brbList[i].toLowerCase()) != -1) {
			botSayToUser(brbList[i] + ' will be right back.', username); 
		}
	}
}


// *****************************************************************
// Theme Functions
//
////////////////////////////////////////////////////////////////////
// fHaveTheme
// Return true if a theme is set, false if no theme is set
function fHaveTheme() {
	return ((themeCur != "") && (themeCur != "none"));
}

////////////////////////////////////////////////////////////////////
// themeClear
// Clear the current theme.
function themeClear(username, userID) {
	if (fIsCaveStaff(userID)) {
		themeCur = ""; 
		botSay('Theme cleared by ' + username + '.'); 
	}
	else {
		botSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the theme.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// themeStart
// Start a new theme.
function themeStart(username, userID, msg, cmd) {

	if (fIsCaveStaff(userID)) {
		var themeNew = msg.trim();
		var cmdTrim = cmd.trim();
		
		themeNew = (themeNew.length > cmdTrim.length) ? themeNew.substr(cmdTrim.length).trim() : "";
		
		if (themeNew.length > 0) {
			themeCur = themeNew; 
			botSay('The new theme is: "'+ themeCur + '".'); 
		}
		else {
			botSayToUser('I didn\'t catch the theme. ' + (fHaveTheme() ? 'The theme is still "' + themeCur + '".' : " No theme is set."), username); 
		} 
	}
	else {
		botSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can start a theme.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// themeTell
// Tell the users what theme is running
function themeTell() {
	botSay(fHaveTheme() ? 'The theme is: "'+ themeCur + '".' : "No theme is set.");
}


// *****************************************************************
// Command Processing
//
////////////////////////////////////////////////////////////////////
// fProcessBotCommands
// Process bot commands entered through chat
// Returns true if msg was recognized as a command, false if it was not recognized as a command
function fProcessBotCommands(msg, username, userID) {
	var fRet = true;
	var fCaveStaff = fIsCaveStaff(userID);
	var cmd = "No Command";
	var chFirst = msg.charAt(0);

	//see if it's a command 
	if ((chFirst == "!") || (chFirst == "\\") || (chFirst == "/")) { 
		var sp = msg.search(" "); 
		if (sp != -1) {	
			cmd = msg.slice(1, sp); 
		} 
		else { 
			cmd = msg.slice(1); 
		} 
	}
	else {
		cmd = msg.trim();
	}
	
	cmd = cmd.toLowerCase(); 

	switch (cmd) 
	{
		//	INFO command 
		case "info": 
		case "info?": 
		case "sayinfo": 
			botSayToUser("Welcome to the Funk & Soul Cave!! Join the Facebook group http://on.fb.me/190KlIP for events, news or to throw a funk signal!", username); 
			break;	
			
		case "help":
		case "helpme":
		case "help me":
		case "help?":
		case "?":
		case "sayhelp": 
			botSayToUser("To get started, add some Funk and/or Soul songs to a playlist (see bottom left corner of your window), activate the playlist (via Activate button in the playlist), and join the queue (via button at bottom left). Say COMMANDS to see a list of available commands.", username); 
			break;

//		case "h":
//			botSay('Shortcut [h]elp: [a]dd, [d]rop, [l]ist, [b]op, [n]ochat, [y]eschat, [s]kipjb'); 
//			break;

		case "commands":
			botSayToUser("Basic commands include Info, Help, Rules, Bop (or Jam), BRB (or AFK), ListBRB (you won't be on the list since chatting indicates you are no longer BRB), NoChat, YesChat, ListNoChat, and Theme. Many commands also have synonyms.", username); 
			break;
			
		case "modcommands":
			if (fCaveStaff) {
				botSayToUser("Mod commands currently include clearBrbList, clearNoChatList, startTheme, and endTheme. For now, phstart and phend just do themeStart and themeEnd. More to come soon.", username); 
			}
			else
				botSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can use Mod Commands.', username); 
			}

			break;
		
		// RULES command
		case "rules": 
		case "rules?":
		case "sayrules": 
			botSayToUser("Room is genre specific please read the room description before djing. Ask mods if you have ?s or would like to join the party.", username); 
			break;
			
		case "hi jb":
			botSay('Hi ' + username); 
			break; 
				
		// AWESOME command 
		case "awesome":
		case "awesome!":
		case "bop":
		case "bop!":
		case "jam":
		case "jam!":
		case "dance":
		case "dance!":
		case "rock":
		case "rock!":
		case "doabarrelroll":
		case "boogie":
		case "boogie!":
		case "shake":
		case "shake!":
		case "shake it":
		case "shake it!":
		case "bob":
		case "bob!":
		case "b":
			botSay(username + ' just asked me to bop!'); 
			break; 
				
		// Unsupported Commands let the user know they are not suupoted
		case "idle":
		case "on":
		case "off": 
		case "game":
		case "count":
		case "bump": 
		case "limit": 
		case "realcount": 
		case "skip":
		case "next": 
		case "down": 
		case "mods": 
		case "trollhelp": 
		case "modhelp": 
		case "themestuff": 
		case "djstuff":
		case "qstuff": 
		case "saystuff": 
		case "ph":  
		case "say": 
		case "saypromo": 
		case "themesongs":
		case "saythemesongs":
		case "tellthemesongs":
		case "saydjs": 
		case "queue":
		case "?queue":
		case "queue?":
		case "que":
		case "?que":
		case "que?":
		case "list": 
		case "q":
		case "q?":
		case "?q":
		case "pq":
		case "l":
		case "add": 
		case "addme":
		case "add me":
		case "q+":
		case "+q":
		case "queue+":
		case "+queue":
		case "que+":
		case "+que":
		case "a":
		case "drop":
		case "dropme":
		case "drop me":
		case "q-":
		case "-q":
		case "queue-":
		case "-queue":
		case "que-":
		case "-que":
		case "dq":
		case "d":	
		case "skipjb":
		case "jbskip":
		case "s":
		case "addsong":
		case "remsong":
		case "storyhelp":
		case "story?":
		case "story":
		case "storynew":
		case "storyclear":				
		case "newstory":
		case "clearstory":
		case "story+":
		case "story-":
		case "storytell":
		case "tellstory":					
			botSayToUser('Sorry, I\'m still learning and don\'t yet support the "' + cmd + '" command.', username); 
			break;

		// Handle Be Right Back commands
		case "brb":
		case "afk":
			addBRB(username);
			break;

		case "brblist":
		case "brbsaylist":
		case "listbrb":
		case "saybrblist":
		case "afklist":
		case "listafk":
			sayBRBList();
			break;

		case "brbclear":			
		case "clearbrb":
		case "clearbrblist":
			clearBRBList(username, userID);
			break;			
		
		// Handle No Chat commands		
		case "nochat":
		case "chat-":
		case "-chat":
		case "c-":
		case "-c":
			addNoChat(username);
		 	break;
	
		case "yeschat":
		case "chat+":
		case "+chat":
		case "c+":
		case "+c":
		case "yc":
			removeNoChat(username);
		 	break;

		case "nochatlist":				
		case "listnochat":				
		case "saynochatlist":
			sayNoChatList();
		 	break;			
			
		case "clearnochat":
		case "clearnochatlist":
			clearNoChatList(username, userID);
		 	break;	

		// Handle Theme commands		
		case "theme": 
		case "theme?": 
		case "saytheme": 
			themeTell();
			break;
		
		case "newtheme": 
		case "starttheme": 
		case "themestart": 
		case "phstart": 		
			themeStart(username, userID, msg, cmd);
			break;	
			
		//case "clear": 
		case "cleartheme": 
		case "themeclear": 
		case "resettheme": 
		case "themereset": 
		case "endtheme": 
		case "themeend": 
		case "phend": 
			themeClear(username, userID);
			break;	

		
		// default: Not a command
		 default: 
			fRet = false;
		 	break;	
	}
	
	if (fRet) {
		sayQuoteSoon();
	}
	
	return fRet;
}