//this is for showing and hiding text in key box and other password input boxes
function showSec(){
	if(showKey.checked){
		pwd.type="TEXT"
	}else{
		pwd.type="PASSWORD"
	}
}

//same, for old Key box
function showOldSec(){
	if(showOldKey.checked){
		oldPwd.type="TEXT"
	}else{
		oldPwd.type="PASSWORD"
	}
}

//same, for decoy In box
function showDecoyPwdIn(){
	if(showDecoyInCheck.checked){
		decoyPwdIn.type="TEXT"
	}else{
		decoyPwdIn.type="PASSWORD"
	}
}

//same, for decoy Out box
function showDecoyPwdOut(){
	if(showDecoyOutCheck.checked){
		decoyPwdOut.type="TEXT"
	}else{
		decoyPwdOut.type="PASSWORD"
	}
}

//to switch beteen basic and all buttons
function switchButtons(){
	if(interfaceBtn.innerText == 'Show all buttons'){
		encryptFileBtn.style.display = '';
		richBtn.style.display = '';
		checkBoxes.style.display = '';
		interfaceBtn.innerText = 'Show main buttons';
		composeMsg.innerHTML = "Now type in your message or load files, check your options, and click the appropriate <b>Encrypt</b> button"
	}else{
		encryptFileBtn.style.display = 'none';
		richBtn.style.display = 'none';
		checkBoxes.style.display = 'none';
		interfaceBtn.innerText = 'Show all buttons';
		composeMsg.innerHTML = "Now type in your message and click <b>Encrypt to email</b>"
	}
}

var allNew = false
//removes some buttons depending on the recipients' list
function updateComposeButtons(emailList){
	allNew = true;	
	for (var index = 0; index < emailList.length; index++){		//scan email array to separate those in the directory from those that are not
		if(locDir[emailList[index].trim()]) allNew = false
	}
	if(emailList.length == 0){moveBtn.style.display = '';}else{moveBtn.style.display = 'none';}		//display backup button in Firefox
	if(allNew){
		encryptBtn.style.display = 'none';
		encryptFileBtn.style.display = 'none';
		inviteBtn.style.display = '';
		interfaceBtn.style.display = 'none';
		checkBoxes.style.display = 'none';
		richBtn.style.display = 'none';
		niceEditor = true;						//to turn off nice editor
		toggleRichText();
		if(!firstTimeUser) setTimeout(function(){composeMsg.innerText = 'None of these recipients are in your directory. You should send them an invitation first. The contents WILL NOT BE SECURE';},20)
	}else{
		inviteBtn.style.display = 'none';
		interfaceBtn.style.display = '';
		encryptBtn.style.display = '';
		if(interfaceBtn.innerText != 'Show all buttons'){
			encryptFileBtn.style.display = '';
			checkBoxes.style.display = '';
			richBtn.style.display = '';
			checkBoxes.style.display = ''
		}else{
			encryptFileBtn.style.display = 'none';
			checkBoxes.style.display = 'none';
			richBtn.style.display = 'none';
			checkBoxes.style.display = 'none'
		}
	}
}

//The key expires after 5 minutes of not being used, this function keeps it alive
function readKey(){
	resetTimer();
	if(!myKey){
		showKeyDialog();
		throw('stopped for key input')
	}
}

//global variables used for password expiration
var keytimer = 0,
	keytime = new Date().getTime();

//this function erases the secret values after 5 minutes
function resetTimer(){
	var period = 300000;
	clearTimeout(keytimer);

	//start timer to reset Password box
	keytimer = setTimeout(function() {
		pwd.value = '';
		myKey = '';
		oldPwdStr = ''
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		pwd.value = '';
		myKey = '';
		oldPwdStr = ''
	}
    keytime = new Date().getTime()
}

//converts user Password into binary format, resumes operation
function acceptKey(){
	var key = pwd.value.trim();
	if(key == ''){
		keyMsg.innerText = 'Please enter your Password';
		throw("no Password")
	}
	if(key.length < 4){
		keyMsg.innerHTML = '<span style="color:orange">This Password is too short</span>';
		throw("short Password")
	}
	keyMsg.innerHTML = '<span class="blink" style="color:orange">LOADING...</span> for best speed, use at least a Medium Password';

	setTimeout(function(){									//execute after a delay so the LOADING message can load
		if(!newPwdAccepted){
			var KeySgn = nacl.sign.keyPair.fromSeed(wiseHash(key,myEmail)).secretKey;
			myKey = ed2curve.convertSecretKey(KeySgn);
			myLockbin = nacl.sign.keyPair.fromSecretKey(KeySgn).publicKey;
			myLock = nacl.util.encodeBase64(myLockbin).replace(/=+$/,'');
			myezLock = changeBase(myLock,base64,base36,true)
		}
		
		checkPassword();									//make sure it was not a mistake by comparing Lock with stored Lock
		if(!locDir[myEmail]) locDir[myEmail] = [];
		locDir[myEmail][0] = myLock;
		syncChromeLock(myEmail,JSON.stringify(locDir[myEmail]));
		
		firstTimeUser = false;
		resetTimer();
		$('#keyScr').dialog("close");
		pwd.value = '';
		if (callKey == 'encrypt'){					//now complete whatever was being done when the Password was found missing
			encrypt()
		}else if(callKey == 'encrypt2file'){
			encrypt2file()
		}else if(callKey == 'inviteEncrypt'){
			inviteEncrypt()
		}else if(callKey == 'decrypt'){
			decrypt()
		}else if(callKey == 'decryptItem'){
			decryptItem()
		}else if(callKey == 'movedb'){
			moveDB()
		}
	},30)
}

var newPwdAccepted = false;
//make sure the Password entered is the same as last time, otherwise stop for confirmation.
function checkPassword(){
	if(!locDir[myEmail]) return;
	if(myLock == locDir[myEmail][0]) return;
	if(!newPwdAccepted){											//first time: arm the button and wait for user to click again
		newPwdAccepted = true;
		keyMsg.innerHTML = "This is not the same Password as last time. If you click <strong>OK</strong> again, it will be accepted as your new Password";
		acceptKeyBtn.style.background = '#FB5216';
		acceptKeyBtn.style.color = 'white';
		setTimeout(function() {
			newPwdAccepted = false;
			acceptKeyBtn.style.background = '';
			acceptKeyBtn.style.color = ''
		}, 10000)								//forget request after 10 seconds
		throw('stopped for Password confirmation')
	}else{															//new Password accepted, so store it and move on
		newPwdAccepted = false
	}
}

//accepts old Password and restarts interrupted process
function acceptOldKey(){
	$('#oldKeyScr').dialog("close");
	oldPwdStr = oldPwd.value.trim();
	oldPwd.value = '';
	if(callKey == 'signedEncrypt'){
		signedEncrypt()
	}else if(callKey == 'readOnceEncrypt'){
		readOnceEncrypt()
	}else if(callKey == 'decrypt'){
		decrypt()
	}
}

//finish what was being done when the cover box was found empty
function acceptCover(){
	$('#coverScr').dialog("close");
	if (callKey == 'encrypt'){
		encrypt()
	}else if(callKey == 'encrypt2file'){
		encrypt2file()
	}
}

//these do the same as the dialog close button, plus they display appropriate messages
function cancelName(){
	$('#nameScr').dialog("close");
	readMsg.innerText = 'Name input canceled'
}

function cancelOldKey(){
	$('#oldKeyScr').dialog("close");
	readMsg.innerText = 'Old Password canceled';
	oldPwd.value = ''
}

function cancelChat(){
	$('#chatScr').dialog("close");
	composeMsg.innerText = 'Chat canceled';
	chatDate.value = ''
}

function cancelAcceptChat(){
	$('#acceptChatScr').dialog("close");
	chatMsg2.innerText = '';
	readMsg.innerText = 'Chat canceled';
	readBox.innerText = ''
}

function cancelStego(){
	$('#coverScr').dialog("close");
	composeMsg.innerText = 'Hiding canceled';
	coverBox.value = '';
	stegoMode.checked = false
}

//opens screen to store new Lock obtained through a message
function openNewLock(){
	showNameDialog();
	nameMsg.innerHTML = 'This message from ' + theirEmail + ' was locked with a new Password. Click <strong>OK</strong> if you wish to accept it.';
	throw('stopped to accept new Lock')
}

function cancelDecoyIn(){
	$('#decoyIn').dialog("close");
	composeMsg.innerText = 'Decoy encryption canceled';
	decoyText.value = '';
	decoyPwdIn.value = '';
	showDecoyInCheck.checked = false
}

function cancelDecoyOut(){
	$('#decoyOut').dialog("close");
	readMsg.innerText = 'Decoy decryption canceled';
	decoyPwdOut.value = '';
	showDecoyOutCheck.checked = false
}

//displays Password strength and resets timer
function pwdKeyup(evt){
	resetTimer();	
	if(pwd.value.trim() == ''){acceptKeyBtn.disabled = true;}else{acceptKeyBtn.disabled = false;};
	newPwdAccepted = false;
	acceptKeyBtn.style.background = '';
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptKey()} else{												//accept upon return, otherwise display strength
		 return keyStrength(pwd.value,'pwd')
	}
}

//enter old password from keyboard
function oldPwdKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){acceptOldKey()}
	else if(oldPwd.value.trim() == ''){return}
}

//enter decoy Key from keyboard
function decoyPwdInKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptDecoyIn()} else {
		return keyStrength(decoyPwdIn.value,'decoy')
	}
}

//enter decoy Key from keyboard
function decoyPwdOutKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13) doDecoyDecrypt()
}

//writes five random dictionary words in the Password box
function suggestKey(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwd.type="TEXT";
	pwd.value = output.trim();
	showKey.checked = true
}

//to blink text
function blinker() {
    $('.blink').fadeOut(500);
    $('.blink').fadeIn(500);
}
setInterval(blinker, 1000); //Runs every second

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); composeBox.focus()
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		composeBox.style.borderTopLeftRadius = '15px';
		composeBox.style.borderTopRightRadius = '15px';
		richBtn.innerText = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		composeBox.style.borderTopLeftRadius = '0';
		composeBox.style.borderTopRightRadius = '0';
		richBtn.innerText = 'Plain';
		niceEditor = true
	}
}

var firstTimeUser = false;
//special instructions displayed on first run
function introGreeting(){
	firstTimeKey.style.display = 'block';
	keyMsg.innerHTML = 'The strength will appear here<br>Enter the Password and click <strong>OK</strong>';
	firstTimeUser = true
}

//to load a file into the compose dialog
function loadFileAsURL(){
	var fileToLoad = loadFile.files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var fileName = fileToLoad.name,
			URLFromFileLoaded = fileLoadedEvent.target.result,
			escapedName = escapeHTML(fileName);
		if(URLFromFileLoaded.length > 2000000){
			var reply = confirm("This file is larger than 1.5MB and Chrome won't save it. Do you want to continue loading it?");
			if(!reply){
				composeMsg.innerText = 'File load canceled';
				throw('file load canceled')
			}
		}
		if(fileToLoad.type.slice(0,4) == "text"){
			if(URLFromFileLoaded.slice(0,2) == '==' && URLFromFileLoaded.slice(-2) == '=='){
				composeBox.innerHTML += '<br><a download="' + escapedName + '" href="data:,' + safeHTML(URLFromFileLoaded) + '">' + escapedName + '</a>'
			}else{
				composeBox.innerHTML += "<br><br>" + URLFromFileLoaded.replace(/  /g,' &nbsp;')
			}
		}else{
			composeBox.innerHTML += '<br><a download="' + escapedName + '" href="' + safeHTML(URLFromFileLoaded) + '">' + escapedName + '</a>'
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		composeMsg.innerHTML = 'This is the content of file <strong>' + safeHTML(fileToLoad.name) + '</strong>'
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		composeMsg.innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted.</strong>'
	}
}

//same, but loading on the read screen and attempting decryption after load
function loadEncryptedFile(){
	var fileToLoad = loadEncrFile.files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(fileToLoad.type.slice(0,4) == "text"){
			text2decrypt = URLFromFileLoaded
		}else{
			text2decrypt = atob(URLFromFileLoaded.split(',')[1])
		}
		decrypt()
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8")
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8")
	}
}

//to load an image into the compose box
function loadImage(){
	var fileToLoad = imgFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) != 'data:image'){
			composeMsg.innerText = 'This file is not a recognized image type';
			return
		}
		composeBox.innerHTML += safeHTML('<img style="width:50%;" src="' + URLFromFileLoaded.replace(/=+$/,'') + '">')
	};
	fileReader.readAsDataURL(fileToLoad, "UTF-8")
}

var time10 = 0;														//to display time needed to process Password

//things that should happen after the email program loads completely
window.addEventListener("load",function(){
  setTimeout(function(){
	showKeyDialog(true);											//initialize some dialogs, but don't show them
	showOldKeyDialog(true);
	console.log(document.title);
	getMyEmail();
	retrieveAllSync();												//get data from sync or local storage
	time10 = hashTime10();											//get milliseconds for 10 wiseHash at iter = 10
  },1000)															//give it an extra second so everything is loaded
})