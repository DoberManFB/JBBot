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
	jbCode.setAttribute('src', 'https://rawgithub.com/DoberManFB/JBBot/master/JBBotPlug_001_005.js'); 
	document.body.appendChild(jbCode); 
}());
*/


// Globals
var JBBotUsername = "";
var JBBotUserID = 0
var CaveBrbList = [];     // list of people who said they will be right back
var CaveNoChatList = [];  // list of people who said they are not available to chat
var CaveThemeCur = "";    // PH theme, or temporary theme set when not on a PH

// Variables for built-in quotes
var JBQuoteTimerCallback = null;
var JBiQuote = 0;
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
JBBotInit();


////////////////////////////////////////////////////////////////////
// JBBotInit
// Setup the callbacks for Plug events that we want to capture
//
function JBBotInit() {
	var user = API.getUser();
	JBBotUsername = user.username;
	JBBotUserID = user.id;

	// Setup the callbacks for Plug events that we want to handle
	API.on(API.CHAT, onCaveChat); 			   // Called on incomming chat
	API.on(API.USER_JOIN, onUserEnteringCave); // Called when somebody enters the cave.
	API.on(API.USER_LEAVE, onUserExitCave);    // Called when somebody leaves the cave.
	API.on(API.ADVANCE, onSongPlayInCave);     // Called when the dj booth advances to the next play.
	API.on(API.WAIT_LIST_UPDATE, onCaveWaitListUpdate); // Called on any change to the DJ queue.

	JBBotSay("Hi Cave Fam!");
}

// *****************************************************************
// Output Utility Functions
//
////////////////////////////////////////////////////////////////////
// JBBotSay
// The string passed in msg is displayed in Chat
//
function JBBotSay(msg) {
	if (msg != "") {
		API.sendChat(msg);
	}
}

////////////////////////////////////////////////////////////////////
// JBBotSayToUser
// The string passed in msg is displayed in Chat, with @username prepended
//
function JBBotSayToUser(msg, username) {
	JBBotSay("@" + username + " " + msg);
}


// *****************************************************************
// Security/Role utiltities
//
////////////////////////////////////////////////////////////////////
// getCaveUserRole
// return the role of the user, as in integer from 0-5:
//    0 No Cave role
//    1 Resident DJ
//    2 Bouncer
//    3 Manager
//    4 Co-Host
//    5 Host
function getCaveUserRole(userID) {
	return API.getUser(userID).role;
}

////////////////////////////////////////////////////////////////////
// fIsCaveMod
// return true if the userID matches one of the cave staff members
function fIsCaveMod(userID) {
	return (getCaveUserRole(userID) > 1);
}


// *****************************************************************
// Event Processing Callback Functions
//
////////////////////////////////////////////////////////////////////
// onCaveChat
// Called when someone enters text in chat
// Plug passes a JSON object contining the following:
//    	type: <string> // "message", "emote", "moderation", "system"
//		un: <string> // the username of the sender
//		uid: <int> // the user id of the sender
//		message: <string> // the chat message
//
function onCaveChat(chatJSON) {

	var username = chatJSON.un;
	
	// only handle actual messages and only ones that are NOT from the bot
	if ((chatJSON.type == "message") && (username != JBBotUsername)) {
		var userID = chatJSON.uid;
		var msg = chatJSON.message;
		var msgLower = msg.toLowerCase();

		// Handle Be Right Back before processing command 'cause the act of chatting takes the user off of the BRB list
		handleBRBonCaveChat(msgLower, username);
		
		if (!fProcessJBBotCommands(msg, username, userID)) {
			if (msgLower.indexOf("jb") >= 0) {
				if ((msgLower.indexOf("where") >= 0) && (msgLower.indexOf("been") >= 0)) {
					JBBotSayToUser("Some say I was gettin busy with Betty Davis, some say I was stayin fired up on the the Mothership, some say I got trapped on an Unfunky TT.FM UFO, but this here bot-of-mystery ain't sayin.", chatJSON.un);
				}
				else if (((msgLower.indexOf("see") >= 0) && (msgLower.indexOf("again") >= 0)) || (msgLower.indexOf("back") >= 0)) {
					JBBotSayToUser("It's been too long. Missed the Cave. Glad to be back and glad to see you again!", chatJSON.un);
				}
				else if ((msgLower.substr(0,2) == "jb") || (msgLower.substr(0,3) == "@jb")) {
					JBBotSayToUser("I hear you, but I'm still blasted from my recent trip on the Mothership, so I dunno whatcha sayin.", chatJSON.un);
				}
				sayJBBotQuoteSoon();
			}
		}
		
		// Handle NoChat stuff after processing the command 'cause the command might be to get off NoChat
		handleNoChatOnCaveChat(msgLower, username);
	}
}

////////////////////////////////////////////////////////////////////
// onUserEnteringCave
// Called when somebody enters the cave. 
// Plug passes in a user object.
//
function onUserEnteringCave(user) {
	if (user && user.username && user.username != "") {
		var szOut = 'Hi @' + user.username + '.';

		if (CaveBrbList.indexOf(user.username) >= 0) {
			removeCaveBRB(user.username); 
			szOut += " Since you are back, I'll stop telling people who chat to you that you'll be right back.";
		}
		
		// If we are running a theme, tell the user who just enterd what theme is running.
		if (fHaveCaveTheme()) {
			szOut += ' We are spinning songs on theme: "' + CaveThemeCur + '"';
		}

		JBBotSay(szOut);
		sayJBBotQuoteSoon();
	}
}

////////////////////////////////////////////////////////////////////
// onUserExitCave
// Called when somebody leaves the cave.
// Plug passes in a user object.
//
function onUserExitCave(user) {
	if (user && user.username && user.username != "") {
		JBBotSay("Looks like " + user.username + " is outta here.");
		// removeCaveNoChatQuietly(user.username); // Commented out 'cause we might want to keep them as nochat in case they are using cell phone and are in and out of the cave.
		sayJBBotQuoteSoon();
	}
}


////////////////////////////////////////////////////////////////////
// onSongPlayInCave
// Called when the dj booth advances to the next play.
// Plug passes in a JSON object containing:
//		a dj user object, 
// 		the current media object, 
// 		a score object, 
// 		and, if there was something playing before the advance, 
// 		the lastPlay object, which is a JSON object of the last played item.
// 
function onSongPlayInCave(jsonObj) {
	// console.log("onSongPlayInCave");
	// console.log(jsonObj);
	wootCurrentCaveSongSoon();
	
/*
	var author = jsonObj.media.author;
	var title = jsonObj.media.title;
	var duration = jsonObj.media.duration;
	var djUsername = jsonObj.dj.username;
	var djID = jsonObj.dj.id;
	var djRole = jsonObj.dj.role;
	playGameOnSongPlay(author, title, duration, djUsername, djID, djRole);
*/
}

////////////////////////////////////////////////////////////////////
// wootCurrentCaveSongSoon
// click the woot button after a delay
function wootCurrentCaveSongSoon() {
	// Timer fires in 3 - 6 seconds
	setTimeout(wootCurrentCaveSong, Math.floor((Math.random() * 4) + 3) * 1000);
}

////////////////////////////////////////////////////////////////////
// wootCurrentCaveSong
// click the woot button 
function wootCurrentCaveSong() {
	if (!fJBBotSpinning()) {
		// document.getElementById('woot').click();
		// $('#button-vote-positive').click();
		$('#woot').click();
		console.log("Woot clicked.");
	}
}

////////////////////////////////////////////////////////////////////
// fAnyoneSpinningInCave
// returns whether or not anyone is spinning 
function fAnyoneSpinningInCave() {
    return (typeof API.getDJ() != 'undefined');
}

////////////////////////////////////////////////////////////////////
// fBotSpinning
// returns whether or not the bot is spinning 
function fJBBotSpinning() {
    return (fAnyoneSpinningInCave() && (API.getDJ().id == JBBotUserID));
}


// *****************************************************************
// Bot Spinning Functions
//
////////////////////////////////////////////////////////////////////
// onCaveWaitListUpdate
// Called when the users in the wait list change, 
// Plug passes an array of the user objects in order from beginning to last in the wait list.
// 
function onCaveWaitListUpdate(rgUsers) {
	console.log(rgUsers);
/*
	var msg = "DJ Queue: " + ((rgUsers.length < 1) ? "Empty." : "");
	for (var i = 0; i < rgUsers.length; i++) {
		msg += rgUsers[i].username;
	}
	JBBotSay(msg);
*/
}

	
////////////////////////////////////////////////////////////////////
// fJBBotOnWaitlist
// returns whether or not the bot is spinning 
function fJBBotOnWaitlist() {
    // return (API.getWaitListPosition(JBBotUserID) >= 0);
	return (false); // temporarily pretend user is not on the waitlist
}


////////////////////////////////////////////////////////////////////
// startSpinningJBBot
// hop on deck or queue up
function startSpinningJBBot() {
	if (!fJBBotSpinning() && !fJBBotOnWaitlist()) {
		API.djJoin();
	}
}

////////////////////////////////////////////////////////////////////
// stopSpinningJBBot
// hop off deck or out of the queue
function stopSpinningJBBot() {
	if (fJBBotSpinning() || fJBBotOnWaitlist()) {
		API.djLeave();
	}
}

////////////////////////////////////////////////////////////////////
// skipJBotSong
// skip the bot's song if the bot is spinning
function skipJBotSong() {
	if (fJBBotSpinning()) {
		API.moderateForceSkip();
	}
}

////////////////////////////////////////////////////////////////////
// onJBBotJumpUpCmd
// hop on deck or queue up
function onJBBotJumpUpCmd(username) {
	if (fJBBotSpinning()) {
		JBBotSayToUser("Thanks for asking me to spin, but I'm already on stage.", username);		
	}
	else if (fJBBotOnWaitlist()) {
		JBBotSayToUser("Thanks for asking me to spin, but I'm already in the DJ queue.", username);
	}
	else {
		startSpinningJBBot();
	}
}

////////////////////////////////////////////////////////////////////
// onJBBotJumpDownCmd
// hop off deck or out of the queue
function onJBBotJumpDownCmd(username) {
	if (fJBBotSpinning()) {
		JBBotSayToUser("Okay, I'll jump off stage.", username);
		stopSpinningJBBot();
	}
	else if (fJBBotOnWaitlist()) {
		JBBotSayToUser("Okay, I'll take myself out of the DJ queue.", username);
		stopSpinningJBBot();
	}
	else {
		JBBotSayToUser("I got your request that I step off stage, but I'm not on stage and I'm not in the DJ queue.", username);
	}
}

////////////////////////////////////////////////////////////////////
// onJBBotSkipCmd
// hop off deck or out of the queue
function onJBBotSkipCmd(username) {
	if (fJBBotSpinning()) {
		JBBotSayToUser("Okay, I'll skip this song.", username);
		skipJBotSong();
	}
	else {
		JBBotSayToUser("Sorry, but I can't skip my song 'cause I'm not on deck.", username);
	}
}

// *****************************************************************
// Bot Quote Functions
//
////////////////////////////////////////////////////////////////////
// sayJBQuote
// Say the next JB Quote in chat
//
function sayJBQuote() {
	if (JBiQuote >= JbQuotes.length) {
		JBiQuote = 0;
	}
	JBBotSay(JbQuotes[JBiQuote]);
	JBiQuote++;
}


////////////////////////////////////////////////////////////////////
// sayJBBotQuoteSoon
// Say the next JB Quote in chat after a delay
//
function sayJBBotQuoteSoon() {
	if (JBQuoteTimerCallback != null) {
		clearTimeout(JBQuoteTimerCallback);
	}

	// Set a new quote timer
	JBQuoteTimerCallback = setTimeout( function() {
		JBQuoteTimerCallback = null;
		sayJBQuote();
	}, 30000); // Timer fires in 30 seconds if not cleared by a new request
}


// *****************************************************************
// NoChat Functions
//
////////////////////////////////////////////////////////////////////
// addCaveNoChat
// Add user specified by username to the No Chat list
function addCaveNoChat(username) {
	if (CaveNoChatList.indexOf(username) == -1) {
		CaveNoChatList.push(username);
		JBBotSayToUser("Until you say your are available to chat (YesChat or Chat+), I will let people who chat to you know you're not available for chat.", username);
	}
	else {
		JBBotSayToUser("You are already on the NoChat list. Say YesChat or Chat+ if you want to be marked as available for chat.", username);
	}
}

////////////////////////////////////////////////////////////////////
// removeCaveNoChatQuietly
// Remove user specified by username from the No Chat list withouth mentioning it
function removeCaveNoChatQuietly(username) {
	var i = CaveNoChatList.indexOf(username);
	if (i >= 0) {
		CaveNoChatList.splice(i, 1); 
	}
}

////////////////////////////////////////////////////////////////////
// removeCaveNoChat
// Remove user specified by username from the No Chat list
function removeCaveNoChat(username) {
	removeCaveNoChatQuietly(username);
	JBBotSayToUser("You are marked as available for chat.", username);
}

////////////////////////////////////////////////////////////////////
// sayCaveNoChatList
// Say in chat the list of users on the No Chat list
function sayCaveNoChatList() {
	JBBotSay((CaveNoChatList.length > 0) ? 'No Chat List: ' + CaveNoChatList.join(', ') : 'The No Chat List is empty.');
}

////////////////////////////////////////////////////////////////////
// clearCaveNoChatList
// Empty the No Chat list. Only Cave Staff can do this.
function clearCaveNoChatList(username, userID) {
	if (fIsCaveMod(userID)) {
		CaveNoChatList.length = 0;
		JBBotSayToUser('No Chat List cleared', username); 	
	}
	else {
		JBBotSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the No Chat List.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// handleNoChatOnCaveChat
// When a user speaks in chat, remove them from the Be Right Back list
// If someone speaks to a user who is on the No Chat list, let them know that the user is
// not available to chat.
function handleNoChatOnCaveChat(msg, username) {
	var msgLower = msg.toLowerCase();

	// If someone other than the user mentions them, say they're not available
	for (var i = 0; i < CaveNoChatList.length; i++) {
		// If someone on the No Chat list is chatting, warn them that they are on the no chat list.
		if (username == CaveNoChatList[i]) {
			JBBotSayToUser(' you are listed as being unable to chat. You can remove yourself from the no chat list by saying yeschat or chat+ or c+', username); 
		}
		
		// If someone mentions a No Chat user, tell them the user is not available for chat
		else if (msgLower.indexOf(CaveNoChatList[i].toLowerCase()) != -1) {
			JBBotSayToUser(CaveNoChatList[i] + ' can\'t chat right now.', username); 
		}
	}
}


// *****************************************************************
// BRB (Be Right Back) Functions
//
////////////////////////////////////////////////////////////////////
// addCaveBRB
// Add user specified by username to the Be Right Back list
function addCaveBRB(username) {
	if (CaveBrbList.indexOf(username) == -1) {
		CaveBrbList.push(username);
		JBBotSayToUser("Until you get back and chat again, I'll tell people who chat to you that you'll be right back.", username); 
	}
}

////////////////////////////////////////////////////////////////////
// removeCaveBRB
// Remove user specified by username from the Be Right Back list
function removeCaveBRB(username) {
	var i = CaveBrbList.indexOf(username);
	if (i >= 0) {
		CaveBrbList.splice(i, 1); 
	}
}

////////////////////////////////////////////////////////////////////
// sayCaveBRBList
// Say in chat the list of users on the Be Right Back list
function sayCaveBRBList() {
	JBBotSay((CaveBrbList.length > 0) ? 'Be Right Back List: ' + CaveBrbList.join(', ') : 'The Be Right Back List is empty.');
}

////////////////////////////////////////////////////////////////////
// clearCaveBRBList
// Empty the BRB list. Only Cave Staff can do this.
function clearCaveBRBList(username, userID) {
	if (fIsCaveMod(userID)) {
		CaveBrbList.length = 0;
		JBBotSayToUser('BRB list cleared', username); 	
	}
	else {
		JBBotSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the Be Right Back List.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// handleBRBonCaveChat
// When a user speaks in chat, remove them from the Be Right Back list
// If someone speaks to a user who is on the BRB list, let them know that the user is
// not available to chat.
function handleBRBonCaveChat(msg, username) {
	var msgLower = msg.toLowerCase();

	// Notice that a user has started chatting, so is no longer AFK (BRB)
	if (CaveBrbList.indexOf(username) >=0) {
		removeCaveBRB(username); 
		JBBotSayToUser("I see you're back, so I'll stop telling people who chat to you that you'll be right back.", username); 
	}
	else {
		// If someone mentions a Be Right Back user, tell them the user is away
		for (var i = 0; i < CaveBrbList.length; i++) {
			if (msgLower.indexOf(CaveBrbList[i].toLowerCase()) != -1) {
				JBBotSayToUser(CaveBrbList[i] + ' is will be right back.', username); 
			}
		}
	}
}


// *****************************************************************
// Theme Functions
//
////////////////////////////////////////////////////////////////////
// fHaveCaveTheme
// Return true if a theme is set, false if no theme is set
function fHaveCaveTheme() {
	return ((CaveThemeCur != "") && (CaveThemeCur != "none"));
}

////////////////////////////////////////////////////////////////////
// clearCaveTheme
// Clear the current theme.
function clearCaveTheme(username, userID) {
	if (fIsCaveMod(userID)) {
		CaveThemeCur = ""; 
		JBBotSay('Theme cleared by ' + username + '.'); 
	}
	else {
		JBBotSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the theme.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// startCaveTheme
// Start a new theme.
function startCaveTheme(msgWithoutCmd, username, userID) {

	if (fIsCaveMod(userID)) {
		if (msgWithoutCmd == "") {
			JBBotSayToUser('I didn\'t catch the theme. ' + (fHaveCaveTheme() ? 'The theme is still "' + CaveThemeCur + '".' : " No theme is set."), username);
		}
		else {
 			CaveThemeCur = msgWithoutCmd; 
			JBBotSay('The new theme is: "' + CaveThemeCur + '".'); 
		} 
	}
	else {
		JBBotSayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can start a theme.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// sayCaveTheme
// Tell the users what theme is running
function sayCaveTheme() {
	JBBotSay(fHaveCaveTheme() ? 'The theme is: "'+ CaveThemeCur + '".' : "No theme is set.");
}


// *****************************************************************
// Command Processing
//
////////////////////////////////////////////////////////////////////
// fProcessJBBotCommands
// Process bot commands entered through chat
// Returns true if msg was recognized as a command, false if it was not recognized as a command
function fProcessJBBotCommands(msg, username, userID) {
	var fRet = true;
	var fCaveStaff = fIsCaveMod(userID);
	var msgTrim = msg.trim();
	var cmd = msgTrim.toLowerCase();
	var chFirst = msgTrim.charAt(0);
	var iFirstSpace = msgTrim.search(" "); 
	var msgWithoutCmd = (iFirstSpace == -1) ? "" : msgTrim.slice(iFirstSpace+1).trim(); // trailing trim because there could be multiple spaces between command and the remaining msg

	//see if it's a command 
	if ((chFirst == "!") || (chFirst == "\\") || (chFirst == "/") || (chFirst == ".")) {
		cmd = (iFirstSpace == -1) ? msgTrim.slice(1) : msgTrim.slice(1, iFirstSpace);
	}
	else {
		// allow a few commands to be multi-word (with spaces), even if there is no leading command character
		if (iFirstSpace != -1) {
			var firstWord = msgTrim.slice(0, iFirstSpace).trim();
			switch (firstWord) 
			{
				// The commands below allow multiple words.
				case "theme": 
				case "newtheme": 
				case "starttheme": 
				case "themestart": 
				case "phstart": 
					cmd = firstWord;
					break;
					
				default: 
					break;	
			}
		}
	}

	switch (cmd) 
	{
		//	INFO command 
		case "info": 
		case "info?": 
		case "sayinfo": 
			JBBotSayToUser("Welcome to the Funk & Soul Cave!! Join the Facebook group http://on.fb.me/190KlIP for events, news or to throw a funk signal!", username); 
			break;	
			
		case "help":
		case "helpme":
		case "help me":
		case "help?":
		case "?":
		case "sayhelp": 
			JBBotSayToUser("To get started, see bottom left of window to add some Funk and/or Soul songs to a playlist, activate the playlist, and join the queue. Say COMMANDS to see some additional commands.", username); 
			break;

		case "commands":
			JBBotSayToUser("Basic commands: Info, Help, Rules, Bop, BRB, NoChat, YesChat, and Theme.", username); 
			break;

		
		case "modcommands":
			if (fCaveStaff) {
				JBBotSayToUser("Mod commands currently include clearBrbList, clearCaveNoChatList, startTheme, and endTheme. For now, phstart and phend just do startTheme and endTheme.", username); 
			}
			else {
				JBBotSayToUser("Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can use Mod Commands.", username); 
			}
			break;

		
		// RULES command
		case "rules": 
		case "rules?":
		case "sayrules": 
			JBBotSayToUser("Room is genre specific please read the room description before djing. Ask mods if you have ?s or would like to join the party.", username); 
			break;
			
		case "hi jb":
			JBBotSay('Hi ' + username); 
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
			JBBotSay(username + ' just asked me to bop!'); 
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
			JBBotSayToUser('Sorry, I\'m still learning and don\'t yet support the "' + cmd + '" command.', username); 
			break;

		// Handle Be Right Back commands
		case "brb":
		case "afk":
			addCaveBRB(username);
			break;

		case "brblist":
		case "brbsaylist":
		case "listbrb":
		case "saybrblist":
		case "afklist":
		case "listafk":
			sayCaveBRBList();
			break;

		case "brbclear":			
		case "clearbrb":
		case "clearbrblist":
			clearCaveBRBList(username, userID);
			break;			
		
		// Handle No Chat commands		
		case "nochat":
		case "chat-":
		case "-chat":
		case "c-":
		case "-c":
			addCaveNoChat(username);
		 	break;
	
		case "yeschat":
		case "chat+":
		case "+chat":
		case "c+":
		case "+c":
		case "yc":
			removeCaveNoChat(username);
		 	break;

		case "nochatlist":				
		case "listnochat":				
		case "saynochatlist":
			sayCaveNoChatList();
		 	break;			
			
		case "clearnochat":
		case "clearnochatlist":
			clearCaveNoChatList(username, userID);
		 	break;	

		// Handle Theme commands		
		case "theme": 
			// Mods can set the theme, but other users can just display it.
			if (fIsCaveMod(userID)) {
				startCaveTheme(msgWithoutCmd, username, userID);
			}
			else {
				sayCaveTheme();
			}
			break;

		case "theme?": 
		case "saytheme": 
			sayCaveTheme();
			break;
			
		case "newtheme": 
		case "starttheme": 
		case "themestart": 
		case "phstart": 		
			startCaveTheme(msgWithoutCmd, username, userID);
			break;	
			
		//case "clear": 
		case "cleartheme": 
		case "themeclear": 
		case "resettheme": 
		case "themereset": 
		case "endtheme": 
		case "themeend": 
		case "phend": 
			clearCaveTheme(username, userID);
			break;	

		// Handle bot spin and stop spinning commands
		case "up": 
		case "jumpup":
		case "spin":
		case "spin+": 
			onJBBotJumpUpCmd(username);
			break;
			
		case "down":
		case "jumpdown": 
		case "nospin": 
		case "spin-": 
			onJBBotJumpDownCmd(username);
			break;
			
		case "skipjb":
		case "jbskip":
		case "jbskipsong":
		case "skip":
		case "skipsong":
		case "next": 
		case "nextsong": 
			onJBBotSkipCmd(username);
			break;
		
		// default: Not a command
		 default: 
			fRet = false;
		 	break;	
	}
	
	if (fRet) {
		sayJBBotQuoteSoon();
	}
	
	return fRet;
}