//displays how many characters are left in chat invitation string
function charsLeftChat(){
	var chars = encodeURI(chatDate.value).replace(/%20/g, ' ').length;
	var limit = 43;
	if (chars <= limit){
		chatMsg.textContent = chars + " characters out of " + limit + " used"
	}else{
		chatMsg.textContent = 'Maximum length exceeded. The message will be truncated'
	}
}

var isChatInvite = false;

//start making a Chat invitation
function displayChat(){
	openScreen('chatScr');
	isChatInvite = true
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	if(!refreshKey()) return;							//check that key is active and stop if not
	openScreen('composeScr');

	if(dataChat.checked){
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else if (videoChat.checked){
		var type = 'C'
	}else{
		var type = 'D'
	}
	var date = chatDate.value;
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,''),
		chatRoom = makeChatRoom();
	composeBox.textContent = date + type + chatRoom + '?' + password;
	var emailArray = composeRecipientsBox.textContent.split(',');
	for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
	if(callKey == 'encrypt2image'){
		encryptList(emailArray,false,true)
	}else{
		encryptList(emailArray,false,false)
	}
	isChatInvite = false
}

//makes a mostly anonymous chatRoom name from four words in the wordlist
function makeChatRoom(){
	var wordlist = wordListExp.toString().slice(1,-2).split('|'),
		name = '';
	for(var i = 0; i < 4; i++){
		name += capitalizeFirstLetter(replaceVariants(wordlist[randomIndex()]))
	}
	return name
}

//capitalizes first letter, the better to blend into Jitsi
function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

//returns a random index for wordlist
function randomIndex(){
	return Math.floor(Math.random()*wordLength)
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//detects if there is a chat invitation in the main box, and opens the Chat window if appropriate
function openChat(){
	var typetoken = readBox.textContent.trim();
	if (typetoken.slice(-44,-43) == '?' && !typetoken.slice(43).match(/[^A-Za-z0-9+\/?]/)){			//chat data detected, so open chat
		var date = typetoken.slice(0,43).trim();									//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\r\n " + date + " \r\n"
		}else{
			var msgStart = ""
		}
		chatMsg2.textContent = msgStart + "\r\nIf you go ahead, the chat session will open now.";
		openScreen('acceptChatScr')
	}
}

//continues to open chat if the user agrees
function acceptChat(){
	chrome.runtime.sendMessage({newtab: "chatTab", typetoken: readBox.textContent.slice(43).trim()});
	openScreen('readScr');
	readBox.textContent = '';
	readMsg.textContent = 'Chat session open in a separate tab. You may close this now.'
}