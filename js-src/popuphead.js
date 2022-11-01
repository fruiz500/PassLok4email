//accepts old Password and restarts interrupted process
function acceptOldKey(){
	$('#oldKeyScr').dialog("close");
	oldPwdStr = oldPwd.value.trim();
	oldPwd.value = '';
	if(callKey == 'encrypt'){
		encrypt()	
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
	readMsg.textContent = 'Name input canceled'
}

function cancelOldKey(){
	$('#oldKeyScr').dialog("close");
	readMsg.textContent = 'Old Password canceled';
	oldPwd.value = ''
}

function cancelChat(){
	$('#chatScr').dialog("close");
	composeMsg.textContent = 'Chat canceled';
	chatDate.value = ''
}

function cancelAcceptChat(){
	$('#acceptChatScr').dialog("close");
	chatMsg2.textContent = '';
	readMsg.textContent = 'Chat canceled';
	readBox.textContent = ''
}

function cancelStego(){
	$('#coverScr').dialog("close");
	composeMsg.textContent = 'Hiding canceled';
	coverBox.value = '';
	stegoMode.checked = false
}

//opens screen to store new Lock obtained through a message
function openNewLock(){
	showNameDialog();
	nameMsg.textContent = 'This message from ' + theirEmail + ' was locked with a new Password. Click OK if you wish to accept it.';
	return
}

//remove jQuery from the following
function cancelDecoyIn(){
	$('#decoyIn').dialog("close");
	composeMsg.textContent = 'Decoy encryption canceled';
	document.getElementById('decoyText').value = '';
	document.getElementById('decoyPwdIn').value = '';
	document.getElementById('showDecoyInCheck').checked = false
}

function cancelDecoyOut(){
	$('#decoyOut').dialog("close");
	readMsg.textContent = 'Decoy decryption canceled';
	document.getElementById('decoyPwdOut').value = '';
	document.getElementById('showDecoyOutCheck').checked = false
}

function showImageDecrypt(){
	showImageDialog();
	encodePNGBtn.style.display = 'none';
	encodeJPGBtn.style.display = 'none';
	decodeImgBtn.style.display = '';
	stegoImageMsg.textContent = "Load the image with the first button, then write the Password if any, and click Decrypt"
}

//displays Password strength and resets timer
function pwdKeyup(evt){
	resetTimer();	
	if(myPwd.value.trim() == ''){acceptKeyBtn.disabled = true;}else{acceptKeyBtn.disabled = false;};
	newPwdAccepted = false;
	acceptKeyBtn.style.background = '';
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptKey()} else{												//accept upon return, otherwise display strength
		 return keyStrength(myPwd.value,'pwd')
	}
}

//enter old password from keyboard
function oldPwdKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){acceptOldKey()} else{
		return keyStrength(document.getElementById('oldPwd').value,'pwdOld')
	}
}

//enter decoy Key from keyboard
function decoyPwdInKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){acceptDecoyIn()} else {
		return keyStrength(document.getElementById('decoyPwdIn').value,'decoyIn')
	}
}

//enter decoy Key from keyboard
function decoyPwdOutKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){doDecoyDecrypt()} else {
		return keyStrength(document.getElementById('decoyPwdOut').value,'decoyOut')
	}
}

//enter image Key from keyboard
function imagePwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(decodeImgBtn.style.display == '' && key == 13){
		decodeImage()
	}else{
		return keyStrength(document.getElementById('imagePwd').value,'image')
	}
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
	myPwd.type="text";
	myPwd.value = output.trim();
	showKey.checked = true;
	keyStrength(output.trim(),true)
}

var time10 = 0;														//to display time needed to process Password

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); composeBox.focus()
}

var firstTimeUser = false;
//special instructions displayed on first run
function introGreeting(){
	firstTimeKey.style.display = 'block';
	keyMsg.textContent = 'The strength will appear here\nEnter the Password and click OK';
	firstTimeUser = true
}

//to load a file into the compose dialog
function loadFile(){
	var fileToLoad = mainFile.files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var fileName = fileToLoad.name,
			URLFromFileLoaded = fileLoadedEvent.target.result,
			escapedName = escapeHTML(fileName);
		if(URLFromFileLoaded.length > 2000000){
			var reply = confirm("This file is larger than 1.5MB and Chrome won't save it. Do you want to continue loading it?");
			if(!reply){
				composeMsg.textContent = 'File load canceled';
				return
			}
		}
		if(fileToLoad.type.slice(0,4) == "text"){
			composeBox.innerHTML += "<br><br>" + URLFromFileLoaded.replace(/  /g,' &nbsp;')
		}else{
			composeBox.innerHTML += '<br><a download="' + escapedName + '" href="' + decryptSanitizer(URLFromFileLoaded) + '">' + escapedName + '</a>'
		}
	}
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		composeMsg.textContent = 'This is the content of file ' + decryptSanitizer(fileToLoad.name)
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		composeMsg.textContent = 'The file has been loaded in encoded form. It is NOT ENCRYPTED.'
	}
	resizeWindow('composeScr')
}

//to load an image into the compose box
function loadImage(){
	var fileToLoad = imgFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) != 'data:image'){
			composeMsg.textContent = 'This file is not a recognized image type';
			return
		}
		composeBox.innerHTML += decryptSanitizer('<img style="width:80%;" src="' + URLFromFileLoaded.replace(/=+$/,'') + '">')
	};
	fileReader.readAsDataURL(fileToLoad, "UTF-8");
	resizeWindow('composeScr')
}

//loads a file or image from the read dialog and starts decryption
function loadEncryptedFile(){
	var fileToLoad = loadEncrFile.files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) == "data:image"){						//if it's an image, trigger image decryption
			previewImg.onload = function(){
				encodePNGBtn.style.display = 'none';
				encodeJPGBtn.style.display = 'none';
				decodeImgBtn.style.display = '';
				
				//populate the image Password box, which requires the Key in the background page
				var reg = new RegExp(myEmail,'g'),
					filteredEmail = senderBox.textContent.replace(reg,'').trim();
				if(filteredEmail && soleRecipient){									//don't do it unless I am the only recipient
					imagePwd.value = nacl.util.encodeBase64(makeShared(convertPubStr(locDir[filteredEmail][0]),myKey)).replace(/=+$/,'');
					stegoImageMsg.textContent =  'The image Password has been pre-filled since you are the only recipient. Check and click Decrypt';
				}else{
					imagePwd.value = '';
					stegoImageMsg.textContent =  'Now type in the Password, if any, and click Decrypt'
				}
				
				showImageDialog()
			}
        	previewImg.style.display = 'block';
        	previewImg.src = URLFromFileLoaded;
		}else if(URLFromFileLoaded.match(',')){						          //otherwise normal decryption
			text2decrypt = URLFromFileLoaded.split(',')[1].replace(/=+$/,'');	//binary case
			decrypt()
		}else{
			text2decrypt = URLFromFileLoaded;									//text case
			decrypt()
		}
	}
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8")
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8")
	}
}

//loads an image and starts image encryption
var loadEncryptImage = function(e) {
	if(!composeBox.textContent){
		composeMsg.textContent = 'Nothing to encrypt';
		return
	}
    var reader = new FileReader();
    reader.onload = function(event) {
        previewImg.style.display = 'block';
        previewImg.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
	previewImg.onload = function(){
		encodePNGBtn.style.display = '';
		encodeJPGBtn.style.display = '';
		decodeImgBtn.style.display = 'none';
		encrypt2image();							//make ciphertext before opening dialog
		
		//try to populate the image Password box
		imagePwd.value = '';	
		updateCapacity();
		openScreen('stegoImageScr');
		resizeWindow('stegoImageScr')
	}
}

//returns milliseconds for 10 scrypt runs at iter=10 so the user can know how long wiseHash will take; called at the end of body script
function hashTime10(){
	var before = Date.now();
	for (var i=0; i<10; i++){
		scrypt('hello','world',10,8,32,0,function(){});
	}
	return Date.now() - before
}

var myKey,KeyStr,myLockbin,myLock,myezLock,myEmail,theirEmail,text2decrypt,emailList;

//reads Key and stops if there's something wrong. If the timer has run out, the Key is deleted from box, and stretched keys are deleted from memory
function refreshKey(){
	resetTimer();
	if (!myKey){
		if(firstTimeUser){
			openScreen('firstKey')
		}else{
			openScreen('keyScr')
		}
		return false
	}
	return true
}

//resets the Keys in memory when the timer ticks off
function resetKeys(){
	myPwd.value = '';
	KeyStr = '';
	myKey = '';
	myLockbin = '';
	myLock = '';
	myezLock = '';
	myEmail = '';
	theirEmail = '';
	emailList = [];
	text2decrypt = '';
	pwdBox.value = '';
	imagePwd.value = '';
	chrome.storage.session.clear()
}

var keyTime = new Date().getTime(), keyTimer = 0;
//this function erases the secret values after 5 minutes
function resetTimer(){
	var period = 300000;
	clearTimeout(keytimer);

	//start timer to reset Password box
	keytimer = setTimeout(function() {
		resetKeys()
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		resetKeys()
	}
    keytime = new Date().getTime()
}
