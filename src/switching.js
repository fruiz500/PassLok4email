//this is for showing and hiding text in key box and other password input boxes
function showSec(){
	if(showKey.checked){
		pwd.type="TEXT";
	}else{
		pwd.type="PASSWORD";
	}
}

//same, for old Key box
function showOldSec(){
	if(showOldKey.checked){
		oldPwd.type="TEXT";
	}else{
		oldPwd.type="PASSWORD";
	}
}

//The key expires after 5 minutes of not being used, this function keeps it alive
function readKey(){
	resetTimer();

	if (!myKey){															//if deleted, prompt again
		any2key();
		keyMsg.innerHTML = 'Please enter your secret Password';
		throw ('Password needed')
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
		oldPwdStr = '';
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		pwd.value = '';
		myKey = '';
		oldPwdStr = '';
	}
    keytime = new Date().getTime();
}

//converts user Password into binary format, resumes operation
function acceptKey(){
	var key = pwd.value.trim();
	if(key == ''){
		keyMsg.innerHTML = 'Please enter your Password';
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
			myezLock = changeBase(myLock,BASE64,BASE36,true)
		}
		
		checkPassword();									//make sure it was not a mistake by comparing Lock with stored Lock
		if(!locDir[myEmail]) locDir[myEmail] = [];
		locDir[myEmail][0] = myLock;
		syncChromeLock(myEmail,JSON.stringify(locDir[myEmail]));
		
		key2any();											//this also deletes the Password from the box
		if (callKey == 'signedEncrypt'){					//now complete whatever was being done when the Password was found missing
			signedEncrypt()
		}else if(callKey == 'readOnceEncrypt'){
			readOnceEncrypt()
		}else if(callKey == 'inviteEncrypt'){
			inviteEncrypt()
		}else if(callKey == 'decrypt'){
			decrypt()
		}else if(callKey == 'decryptItem'){
			decryptItem()
		}
	},30);
}

var newPwdAccepted = false;
//make sure the Password entered is the same as last time, otherwise stop for confirmation.
function checkPassword(){
	if(!locDir[myEmail]) return;
	if(myLock == locDir[myEmail][0]) return;
	if(!newPwdAccepted){											//first time: arm the button and wait for user to click again
		newPwdAccepted = true;
		keyMsg.innerHTML = "This is not the same Password as last time. If you click <strong>OK</strong> again, it will be accepted as your new Password";
		acceptKeyBtn.style.background = '#F2B563';
		setTimeout(function() {
			newPwdAccepted = false;
			acceptKeyBtn.style.background = '';
		}, 10000)								//forget request after 10 seconds
		throw('stopped for Password confirmation')
	}else{															//new Password accepted, so store it and move on
		newPwdAccepted = false;
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

//these do the same as the dialog close button, plus they display appropriate messages
function cancelName(){
	$('#nameScr').dialog("close");
	readMsg.innerHTML = 'Name input canceled';
}

function cancelOldKey(){
	$('#oldKeyScr').dialog("close");
	readMsg.innerHTML = 'Old Password canceled';
	oldPwd.value = '';
}

function cancelChat(){
	$('#chatScr').dialog("close");
	composeMsg.innerHTML = 'Chat canceled';
	chatDate.value = '';
}

function cancelAcceptChat(){
	$('#acceptChatScr').dialog("close");
	chatMsg.innerHTML = '';
	readMsg.innerHTML = 'Chat canceled';
	readBox.innerHTML = '';
}

//opens screen to store new Lock obtained through a message
function openNewLock(){
	showNameDialog();
	nameMsg.innerHTML = 'This message from ' + theirEmail + ' was locked with a new Password. Click <strong>OK</strong> if you wish to accept it.';
	throw('stopped to accept new Lock')
}

//displays Password strength and resets timer
function pwdKeyup(evt){
	resetTimer();	
	if(pwd.value.trim() == ''){acceptKeyBtn.disabled = true;}else{acceptKeyBtn.disabled = false;};
	newPwdAccepted = false;
	acceptKeyBtn.style.background = '';
	evt = evt || window.event
	if (evt.keyCode == 13){acceptKey()} else{												//accept upon return, otherwise display strength
		 return keyStrength(pwd.value,true);
	}
}

//enter old password from keyboard
function oldPwdKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){acceptOldKey()}
	else if(oldPwd.value.trim() == ''){return}
}

//called when the Key box is empty
function any2key(){
	$('#keyScr').dialog("open")
}

//close screens and reset Key timer when leaving the Key box. Restarts whatever was being done when the Key was found missing.
function key2any(){
	resetTimer();
	$('#keyScr').dialog("close");
	pwd.value = '';
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
	  document.execCommand(sCmd, false, sValue); composeBox.focus();
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		composeBox.style.borderTopLeftRadius = '15px';
		composeBox.style.borderTopRightRadius = '15px';
		richBtn.innerHTML = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		composeBox.style.borderTopLeftRadius = '0';
		composeBox.style.borderTopRightRadius = '0';
		richBtn.innerHTML = 'Plain';
		niceEditor = true
	}
}

//special instructions displayed on first run
function introGreeting(){
	firstTimeKey.style.display = 'block';
	keyMsg.innerHTML = 'The strength will appear here<br>Enter the Password and click <strong>OK</strong>';
}

//to save the contents of the read dialog as a file in the default Downloads folder
function saveURLAsFile(){
	var URLToWrite = readBox.innerHTML.trim().replace(/<br>/g,'\n'),
		URLToWriteSplit = URLToWrite.split('\n'),
		content = '',
		fileNameToSaveAs = '';
		
	for(var i = 0; i < URLToWriteSplit.length; i++){
		if(URLToWriteSplit[i].toLowerCase().match('data:;')){
			content = URLToWriteSplit[i].trim();
			fileNameToSaveAs = URLToWriteSplit[i - 1].split(':')[1];
			break
		}
	}

	var downloadLink = document.createElement("a");
	if(content.slice(0,4).toLowerCase()=='data'){							//regular save of encoded file

//first check if the file can lead to problems, and if so display a message
		var extension = fileNameToSaveAs.toLowerCase().match(/\.\w+$/);
		var suspicious =  ['.exe','.scr','.url','.com','.pif','.bat','.xht','.htm','.html','.xml','.xhtml','.js','.sh','.svg','.gadget','.msi','.msp','.hta','.cpl','.msc','.jar','.cmd','.vb','.vbs','.jse','.ws','.wsf','.wsc','.wsh','.ps1','.ps2','.ps1xml','.ps2xml','.psc1','.scf','.lnk','.inf','.reg','.doc','.xls','.ppt','.pdf','.swf','.fla','.docm','.dotm','.xlsm','.xltm','.xlam','.pptm','.potm','.ppam','.ppsm','.sldm','.dll','.dllx','.rar','.zip','.7z','.gzip','.gzip2','.tar','.fon','.svgz','.jnlp'];
		if(extension){
			var index = suspicious.indexOf(extension[0])
		} else {
			var index = -1
		}

		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
	} else {																//to save contents as text file
		var textFileAsBlob = new Blob([readBox.innerHTML.trim()], {type:'text/plain'});
		downloadLink.download = 'PassLok save.html';
		downloadLink.innerHTML = "Download File";
		content = window.URL.createObjectURL(textFileAsBlob);
	}
	downloadLink.href = content;
	downloadLink.click();

	if(index >= 0){
		readMsg.innerHTML = "<span style='color:red;'>WARNING: This file has extension " + suspicious[index] + "  Accessing it might lead to executing a malicious payload</span>"
	}else{
		readMsg.innerHTML = 'File saved with filename ' + downloadLink.download;
	}
}

//to load a file into the compose dialog
function loadFileAsURL(){
	var fileToLoad = loadFile.files[0];
	
	var fileReader = new FileReader();
	fileReader.onloadend = function(fileLoadedEvent){
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(fileToLoad.type.slice(0,4) == "text"){
			composeBox.innerHTML += "<br><br>" + URLFromFileLoaded.replace(/  /g,' &nbsp;');
		}else{
			composeBox.innerHTML += "<br><br>filename:" + fileName + "<br>" + URLFromFileLoaded;
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		composeMsg.innerHTML = 'This is the content of file <strong>' + fileToLoad.name + '</strong>';
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		composeMsg.innerHTML = 'The file has been loaded in encoded form. It is <strong>not encrypted.</strong>';
	}
}

var time10 = 0;														//to display time needed to process Password

//things that should happen after the email program loads completely
window.addEventListener("load",function(){
  setTimeout(function(){
	showKeyDialog(true);											//initialize password dialogs, but don't show them
	showOldKeyDialog(true);
	console.log(document.title);
	getMyEmail();
	retrieveAllSync();												//get data from sync storage
	time10 = hashTime10();											//get milliseconds for 10 wiseHash at iter = 10
  },1000)															//give it an extra second so everything is loaded
})