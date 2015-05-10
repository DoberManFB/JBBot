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
	jbCode.setAttribute('src', 'https://rawgithub.com/DoberManFB/JBBot/master/JBBotPlug_002_001.js'); 
	document.body.appendChild(jbCode); 
}());
*/


// Bring the bot to life (the bot lives in the cave, so creating the cave creates and runs the bot)
var fsCave = new FSCave();


////////////////////////////////////////////////////////////////////
// -----------------------------------------------------------------
//
// FSCave class
// The FSCave class handles room stuff
// The bot is in the room (the FSCave class has a bot)
// The room has a BRB list
// The room has a NoChat list
// The room has a Theme (which can be on or off)
//
// -----------------------------------------------------------------
////////////////////////////////////////////////////////////////////

// FSCCave 'ctor
function FSCave() {
	this.bot = new JBBot();
	this.brbList = [];     // list of people who said they will be right back
	this.noChatList = [];  // list of people who said they are not available to chat
	this.theme = "";       // PH theme, or temporary theme set when not on a PH
	
	// Setup the callbacks for Plug events that we want to handle
	API.on(API.CHAT, this.onCaveChat); 			        // Called on incomming chat
	API.on(API.USER_JOIN, this.onUserEnteringCave);     // Called when somebody enters the cave.
	API.on(API.USER_LEAVE, this.onUserExitCave);        // Called when somebody leaves the cave.
	API.on(API.ADVANCE, this.onSongPlayInCave);         // Called when the dj booth advances to the next play.
	API.on(API.WAIT_LIST_UPDATE, this.onDJQueueUpdate); // Called on any change to the DJ queue.

	this.bot.say("Hi Cave Fam!");
}

////////////////////////////////////////////////////////////////////
// FSCave onCaveChat
// Called when someone enters text in chat
// Plug passes a JSON object contining the following:
//    	type: <string> // "message", "emote", "moderation", "system"
//		un: <string> // the username of the sender
//		uid: <int> // the user id of the sender
//		message: <string> // the chat message
//
FSCave.prototype.onCaveChat = function (chatJSON) {

	var username = chatJSON.un;
	
	// only handle actual messages and only ones that are NOT from the bot
	if ((chatJSON.type == "message") && (username != this.bot.getName())) {
		var userID = chatJSON.uid;
		var msg = chatJSON.message;
		var msgLower = msg.toLowerCase();

		// Handle Be Right Back before processing command 'cause the act of chatting takes the user off of the BRB list
		this.handleBRBonChat(msgLower, username);
		
		// Process the command. Right now we don't use the return value, but later we might wanna do something special if it's not a command.
		this.fProcessCommands(msg, username, userID);
		
		// Handle NoChat stuff after processing the command 'cause the command might be to get off NoChat
		this.handleNoChatOnChat(msgLower, username);
	}
}

////////////////////////////////////////////////////////////////////
// FSCave onUserEnteringCave
// Called when somebody enters the cave. 
// Plug passes in a user object.
//
FSCave.prototype.onUserEnteringCave = function (user) {
	if (user && user.username && user.username != "") {
		var szOut = 'Hi @' + user.username + '.';

		if (this.brbList.indexOf(user.username) >= 0) {
			this.removeBRB(user.username); 
			szOut += " Since you are back, I'll stop telling people who chat to you that you'll be right back.";
		}
		
		// If we are running a theme, tell the user who just enterd what theme is running.
		if (this.fHaveTheme()) {
			szOut += ' We are spinning songs on theme: "' + this.theme + '"';
		}

		this.bot.say(szOut);
		this.bot.sayQuoteSoon();
	}
}

////////////////////////////////////////////////////////////////////
// FSCave onUserExitCave
// Called when somebody leaves the cave.
// Plug passes in a user object.
//
FSCave.prototype.onUserExitCave = function (user) {
	if (user && user.username && user.username != "") {
		this.bot.say("Looks like " + user.username + " is outta here.");
		// this.removeNoChatQuietly(user.username); // Commented out 'cause we might want to keep them as nochat in case they are using cell phone and are in and out of the cave.
		this.bot.sayQuoteSoon();
	}
}

////////////////////////////////////////////////////////////////////
// FSCave onSongPlayInCave
// Called when the dj booth advances to the next play.
// Plug passes in a JSON object containing:
//		a dj user object, 
// 		the current media object, 
// 		a score object, 
// 		and, if there was something playing before the advance, 
// 		the lastPlay object, which is a JSON object of the last played item.
// 
FSCave.prototype.onSongPlayInCave = function (jsonObj) {
	// console.log("onSongPlayInCave");
	// console.log(jsonObj);
	this.bot.wootSoon();
	
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
// FSCave onDJQueueUpdate
// Called when the users in the wait list change, 
// Plug passes an array of the user objects in order from beginning to last in the wait list.
// 
FSCave.prototype.onDJQueueUpdate = function (rgUsers) {
	console.log(rgUsers);
/*
	var msg = "DJ Queue: " + ((rgUsers.length < 1) ? "Empty." : "");
	for (var i = 0; i < rgUsers.length; i++) {
		msg += rgUsers[i].username;
	}
	this.bot.say(msg);
*/
}

////////////////////////////////////////////////////////////////////
// FSCave getUserRole
// return the role of the user, as in integer from 0-5:
//    0 No Cave role
//    1 Resident DJ
//    2 Bouncer
//    3 Manager
//    4 Co-Host
//    5 Host
FSCave.prototype.getUserRole = function (userID) {
	return API.getUser(userID).role;
}

FSCave.prototype.fIsCaveMod = function (userID) {
	return (this.getUserRole(userID) > 1);
}

FSCave.prototype.fAnyoneSpinning = function () {
    return (typeof API.getDJ() != 'undefined');
}

FSCave.prototype.addNoChat = function (username) {
	if (this.noChatList.indexOf(username) == -1) {
		this.noChatList.push(username);
		this.bot.sayToUser("Until you say your are available to chat (YesChat or Chat+), I will let people who chat to you know you're not available for chat.", username);
	}
	else {
		this.bot.sayToUser("You are already on the NoChat list. Say YesChat or Chat+ if you want to be marked as available for chat.", username);
	}
}

FSCave.prototype.removeNoChatQuietly = function (username) {
	var i = this.noChatList.indexOf(username);
	if (i >= 0) {
		this.noChatList.splice(i, 1); 
	}
}

FSCave.prototype.removeNoChat = function (username) {
	this.removeNoChatQuietly(username);
	this.bot.sayToUser("You are marked as available for chat.", username);
}

FSCave.prototype.sayNoChatList = function () {
	this.bot.say((this.noChatList.length > 0) ? 'No Chat List: ' + this.noChatList.join(', ') : 'The No Chat List is empty.');
}

////////////////////////////////////////////////////////////////////
// FSCave clearNoChatList
// Empty the No Chat list. Only Cave Staff can do this.
FSCave.prototype.clearNoChatList = function (username, userID) {
	if (this.fIsCaveMod(userID)) {
		this.noChatList.length = 0;
		this.bot.sayToUser('No Chat List cleared', username); 	
	}
	else {
		this.bot.sayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the No Chat List.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// FSCave handleNoChatOnChat
// When a user speaks in chat, remove them from the Be Right Back list
// If someone speaks to a user who is on the No Chat list, let them know that the user is
// not available to chat.
FSCave.prototype.handleNoChatOnChat = function (msg, username) {
	var msgLower = msg.toLowerCase();

	// If someone other than the user mentions them, say they're not available
	for (var i = 0; i < this.noChatList.length; i++) {
		// If someone on the No Chat list is chatting, warn them that they are on the no chat list.
		if (username == this.noChatList[i]) {
			this.bot.sayToUser(' you are listed as being unable to chat. You can remove yourself from the no chat list by saying yeschat or chat+ or c+', username); 
		}
		
		// If someone mentions a No Chat user, tell them the user is not available for chat
		else if (msgLower.indexOf(this.noChatList[i].toLowerCase()) != -1) {
			this.bot.sayToUser(this.noChatList[i] + ' can\'t chat right now.', username); 
		}
	}
}

FSCave.prototype.addBRB = function (username) {
	if (this.brbList.indexOf(username) == -1) {
		this.brbList.push(username);
		this.bot.sayToUser("Until you get back and chat again, I'll tell people who chat to you that you'll be right back.", username); 
	}
}

FSCave.prototype.removeBRB = function (username) {
	var i = this.brbList.indexOf(username);
	if (i >= 0) {
		this.brbList.splice(i, 1); 
	}
}

FSCave.prototype.sayBRBList = function () {
	this.bot.say((this.brbList.length > 0) ? 'Be Right Back List: ' + this.brbList.join(', ') : 'The Be Right Back List is empty.');
}

FSCave.prototype.clearBRBList = function (username, userID) {
	if (this.fIsCaveMod(userID)) {
		this.brbList.length = 0;
		this.bot.sayToUser('BRB list cleared', username); 	
	}
	else {
		this.bot.sayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the Be Right Back List.', username); 
	}
}

FSCave.prototype.handleBRBonChat = function (msg, username) {
	var msgLower = msg.toLowerCase();

	// Notice that a user has started chatting, so is no longer AFK (BRB)
	if (this.brbList.indexOf(username) >=0) {
		this.removeBRB(username); 
		this.bot.sayToUser("I see you're back, so I'll stop telling people who chat to you that you'll be right back.", username); 
	}
	else {
		// If someone mentions a Be Right Back user, tell them the user is away
		for (var i = 0; i < this.brbList.length; i++) {
			if (msgLower.indexOf(this.brbList[i].toLowerCase()) != -1) {
				this.bot.sayToUser(this.brbList[i] + ' is will be right back.', username); 
			}
		}
	}
}

FSCave.prototype.fHaveTheme = function () {
	return (this.theme != "");
}

FSCave.prototype.clearTheme = function (username, userID) {
	if (this.fIsCaveMod(userID)) {
		this.theme = ""; 
		this.bot.say('Theme cleared by ' + username + '.'); 
	}
	else {
		this.bot.sayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can clear the theme.', username); 
	}
}

////////////////////////////////////////////////////////////////////
// startTheme
// Start a new theme.
FSCave.prototype.startTheme = function (msgWithoutCmd, username, userID) {

	if (this.fIsCaveMod(userID)) {
		if (msgWithoutCmd == "") {
			this.bot.sayToUser('I didn\'t catch the theme. ' + (this.fHaveTheme() ? 'The theme is still "' + this.theme + '".' : " No theme is set."), username);
		}
		else {
 			this.theme = msgWithoutCmd; 
			this.bot.say('The new theme is: "' + this.theme + '".'); 
		} 
	}
	else {
		this.bot.sayToUser('Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can start a theme.', username); 
	}
}

FSCave.prototype.sayTheme = function () {
	this.bot.say(this.fHaveTheme() ? 'The theme is: "'+ this.theme + '".' : "No theme is set.");
}


// *****************************************************************
//
// Command Processing
//
// *****************************************************************

////////////////////////////////////////////////////////////////////
// fProcessCommands
// Process bot commands entered through chat
// Returns true if msg was recognized as a command, false if it was not recognized as a command
FSCave.prototype.fProcessCommands = function (msg, username, userID) {
	var fRet = true;
	var fCaveStaff = this.fIsCaveMod(userID);
	var msgTrim = msg.trim();
	var msgLower = msgTrim.toLowerCase();
	var cmd = msgLower;
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
			this.bot.sayToUser("Welcome to the Funk & Soul Cave!! Join the Facebook group http://on.fb.me/190KlIP for events, news or to throw a funk signal!", username); 
			break;	
			
		case "help":
		case "helpme":
		case "help me":
		case "help?":
		case "?":
		case "sayhelp": 
			this.bot.sayToUser("To get started, see bottom left of window to add some Funk and/or Soul songs to a playlist, activate the playlist, and join the queue. Say COMMANDS to see some additional commands.", username); 
			break;

		case "commands":
			this.bot.sayToUser("Basic commands: Info, Help, Rules, Bop, BRB, NoChat, YesChat, and Theme.", username); 
			break;

		
		case "modcommands":
			if (fCaveStaff) {
				this.bot.sayToUser("Mod commands currently include clearBrbList, clearNoChatList, startTheme, and endTheme. For now, phstart and phend just do startTheme and endTheme.", username); 
			}
			else {
				this.bot.sayToUser("Sorry, only cave staff (Bouncers, Managers, Co-Host, or Host) can use Mod Commands.", username); 
			}
			break;

		
		// RULES command
		case "rules": 
		case "rules?":
		case "sayrules": 
			this.bot.sayToUser("Room is genre specific please read the room description before djing. Ask mods if you have ?s or would like to join the party.", username); 
			break;
			
		case "hi jb":
			this.bot.say('Hi ' + username); 
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
			this.bot.say(username + ' just asked me to bop!'); 
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
			this.bot.sayToUser('Sorry, I\'m still learning and don\'t yet support the "' + cmd + '" command.', username); 
			break;

		// Handle Be Right Back commands
		case "brb":
		case "afk":
			this.addBRB(username);
			break;

		case "brblist":
		case "brbsaylist":
		case "listbrb":
		case "saybrblist":
		case "afklist":
		case "listafk":
			this.sayBRBList();
			break;

		case "brbclear":			
		case "clearbrb":
		case "clearbrblist":
			this.clearBRBList(username, userID);
			break;			
		
		// Handle No Chat commands		
		case "nochat":
		case "chat-":
		case "-chat":
		case "c-":
		case "-c":
			this.addNoChat(username);
		 	break;
	
		case "yeschat":
		case "chat+":
		case "+chat":
		case "c+":
		case "+c":
		case "yc":
			this.removeNoChat(username);
		 	break;

		case "nochatlist":				
		case "listnochat":				
		case "saynochatlist":
			this.sayNoChatList();
		 	break;			
			
		case "clearnochat":
		case "clearnochatlist":
			this.clearNoChatList(username, userID);
		 	break;	

		// Handle Theme commands		
		case "theme": 
			// Mods can set the theme, but other users can just display it.
			if (this.fIsCaveMod(userID)) {
				this.startTheme(msgWithoutCmd, username, userID);
			}
			else {
				this.sayTheme();
			}
			break;

		case "theme?": 
		case "saytheme": 
			this.sayTheme();
			break;
			
		case "newtheme": 
		case "starttheme": 
		case "themestart": 
		case "phstart": 		
			this.startTheme(msgWithoutCmd, username, userID);
			break;	
			
		//case "clear": 
		case "cleartheme": 
		case "themeclear": 
		case "resettheme": 
		case "themereset": 
		case "endtheme": 
		case "themeend": 
		case "phend": 
			this.clearTheme(username, userID);
			break;	

		// Handle bot spin and stop spinning commands
		case "up": 
		case "jumpup":
		case "spin":
		case "spin+": 
			this.bot.onStartSpinningCmd(username);
			break;
			
		case "down":
		case "jumpdown": 
		case "nospin": 
		case "spin-": 
			this.bot.onStopSpinningCmd(username);
			break;
			
		case "skipjb":
		case "jbskip":
		case "jbskipsong":
		case "skip":
		case "skipsong":
		case "next": 
		case "nextsong": 
			this.bot.onSkipBotSongCmd(username);
			break;
		
		// default: Not a command
		 default: 
			fRet = false;
		 	break;	
	}
	
	if (fRet) {
		this.bot.sayQuoteSoon();
	}
	else if (msgLower.indexOf("jb") >= 0) {
		if ((msgLower.indexOf("where") >= 0) && (msgLower.indexOf("been") >= 0)) {
			this.bot.sayToUser("Some say I was gettin busy with Betty Davis, some say I was stayin fired up on the the Mothership, some say I got trapped on an Unfunky TT.FM UFO, but this here bot-of-mystery ain't sayin.", chatJSON.un);
		}
		else if (((msgLower.indexOf("see") >= 0) && (msgLower.indexOf("again") >= 0)) || (msgLower.indexOf("back") >= 0)) {
			this.bot.sayToUser("It's been too long. Missed the Cave. Glad to be back and glad to see you again!", chatJSON.un);
		}
		else if ((msgLower.substr(0,2) == "jb") || (msgLower.substr(0,3) == "@jb")) {
			this.bot.sayToUser("I hear you, but I'm still blasted from my recent trip on the Mothership, so I dunno whatcha sayin.", chatJSON.un);
		}
		this.bot.sayQuoteSoon();
	}
	
	return fRet;
}

////////////////////////////////////////////////////////////////////
// -----------------------------------------------------------------
//
// JBBot class
// The FSCave class handles bot stuff, such as event callbacks and bot functions
//
// -----------------------------------------------------------------
////////////////////////////////////////////////////////////////////

// JBot ctor:
function JBBot() {
	var user = API.getUser();
	this.username = user.username;
	this.userID = user.id;
	this.quoteTimerCallback = null;
	this.iQuote = 0;
	this.quotes = [ 'Haiiii!', 
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

	// this.say("Hi Cave Fam!");
}

JBBot.prototype.getName = function () {
	return (this.username);
}

JBBot.prototype.getUserID = function () {
	return (this.userID);
}

JBBot.prototype.say = function (msg) {
	if (msg != "") {
		API.sendChat(msg);
	}
}

JBBot.prototype.sayToUser = function (msg, username) {
	this.say("@" + username + " " + msg);
}

JBBot.prototype.wootSoon = function () {
	// Timer fires in 3 - 6 seconds
	setTimeout(this.woot, Math.floor((Math.random() * 4) + 3) * 1000);
}

JBBot.prototype.woot = function () {
	if (!this.fSpinning()) {
		$('#woot').click();
	}
}

JBBot.prototype.fSpinning = function () {
	// return whether or not the bot is spinning 
    return ((typeof API.getDJ() != 'undefined') && (API.getDJ().id == this.userID));
}
	
JBBot.prototype.fOnWaitlist = function () {
	// API.getWaitListPosition doesn't seem to be working, so we'll use our own
    // return (API.getWaitListPosition(JBBotUserID) >= 0);
    return (getCaveWaitListPosition(this.userID) >= 0);
}

JBBot.prototype.startSpinning = function () {
	if (!this.fSpinning() && !this.fOnWaitlist()) {
		API.djJoin(); // hop on deck or queue up
	}
}

JBBot.prototype.stopSpinning = function () {
	if (this.fSpinning() || this.fOnWaitlist()) {
		API.djLeave();
	}
}

JBBot.prototype.skipBotSong = function () {
	if (this.fSpinning()) {
		API.moderateForceSkip(); // skip the bot's song if the bot is spinning
	}
}

JBBot.prototype.onStartSpinningCmd = function (username) {
	if (this.fSpinning()) {
		this.sayToUser("Thanks for asking me to spin, but I'm already on stage.", username);		
	}
	else if (this.fOnWaitlist()) {
		this.sayToUser("Thanks for asking me to spin, but I'm already in the DJ queue.", username);
	}
	else {
		this.sayToUser("Okay, I'll spin some.", username);
		this.startSpinning();
	}
}

JBBot.prototype.onStopSpinningCmd = function (username) {
	if (this.fSpinning()) {
		this.sayToUser("Okay, I'll jump off stage.", username);
		this.stopSpinning();
	}
	else if (this.fOnWaitlist()) {
		this.sayToUser("Okay, I'll take myself out of the DJ queue.", username);
		this.stopSpinning();
	}
	else {
		this.sayToUser("I got your request that I step off stage, but I'm not on stage and I'm not in the DJ queue.", username);
	}
}

JBBot.prototype.onSkipBotSongCmd = function (username) {
	if (this.fSpinning()) {
		this.sayToUser("Okay, I'll skip this song.", username);
		this.skipBotSong();
	}
	else {
		this.sayToUser("Sorry, but I can't skip my song 'cause I'm not on deck.", username);
	}
}

JBBot.prototype.sayQuote = function () {
	if (this.iQuote >= this.quotes.length) {
		this.iQuote = 0;
	}
	this.say(this.quotes[this.iQuote]);
	this.iQuote++;
}

JBBot.prototype.sayQuoteSoon = function () {
	if (this.quoteTimerCallback != null) {
		clearTimeout(this.quoteTimerCallback);
	}

	// Set a new quote timer
	this.quoteTimerCallback = setTimeout( function() {
		this.quoteTimerCallback = null;
		this.sayQuote();
	}, 30000); // Timer fires in 30 seconds if not cleared by a new request
}


////////////////////////////////////////////////////////////////////
// -----------------------------------------------------------------
//
// Utility Functions
//
////////////////////////////////////////////////////////////////////
// -----------------------------------------------------------------

////////////////////////////////////////////////////////////////////
// getCaveWaitListPosition
// Since API.getWaitListPosition() seems to be broken, this is a replacement
function getCaveWaitListPosition(userid) {
	var iRet = -1;
	var wl = API.getWaitList();
	var len = wl.length;
	for (var i = 0; ((i < len) && (iRet == -1)); i++) {
		if (wl[i].id == userid) {
			iRet = i;
		}
	}
    return (iRet);
}

// ***
// EOF
// ***