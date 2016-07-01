//displays how many characters are left in chat invitation string
function charsLeftChat(){
	var chars = encodeURI(chatDate.value).replace(/%20/g, ' ').length;
	var limit = 43;
	if (chars <= limit){
		chatMsg.innerText = chars + " characters out of " + limit + " used"
	}else{
		chatMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
	}
}

//start making a Chat invitation
function displayChat(){
	showChatDialog();
	isChatInvite = true
}

var isChatInvite = false;
//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	$('#chatScr').dialog("close");

	if(dataChat.checked){
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else{
		var type = 'C'
	}
	var date = chatDate.value;
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),
		chatRoom = makeChatRoom();
	composeBox.innerText = date + type + chatRoom + password;
	signedEncrypt()
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var blacklist = blackListExp.toString().slice(1,-2).split('|'),
		name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
	if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	while(name.length < 20) name += ' ';
	return name
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = Math.floor(Math.random()*blackLength)
	}
	return index
}

//detects if there is a chat invitation in the main box, and opens the Chat window if appropriate
function openChat(){
	var typetoken = readBox.innerHTML.trim();
	if (typetoken.length == 107 && !typetoken.slice(-43).match(' ')){			//chat invite detected, so open chat
		var date = typetoken.slice(0,43).trim();									//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
		}else{
			var msgStart = ""
		}
		showAcceptChatDialog(msgStart + "If you go ahead, the chat session will open now.")
	}
}

//continues to open chat if the user agrees
function acceptChat(){
	chrome.runtime.sendMessage({newtab: "chatTab", typetoken: readBox.innerHTML.trim()}, function (response) {
		console.log(response.farewell);
	});

	$('#acceptChatScr').dialog("close");

	readBox.innerText = '';
	readMsg.innerText = 'Chat session open on a separate tab. You may close this now.'
}