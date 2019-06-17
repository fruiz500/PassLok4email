//start blinking message, for Msg elements
function blinkMsg(element){
	element.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	element.appendChild(blinker)
}

//this is for showing and hiding text in key box and other password input boxes
function showSec(){
	var pwdIn = document.getElementById('myPwd');
	if(pwdIn.type=="password"){
		pwdIn.type="text";
		showKey.src = hideImg
	}else{
		pwdIn.type="password";
		showKey.src = eyeImg
	}
	keyStrength(pwdIn.value.trim(),'pwd')
}

//same, for old Key box
function showOldSec(){
	var oldPwdIn = document.getElementById('oldPwdBox');
	if(oldPwdIn.type=="password"){
		oldPwdIn.type="text";
		showOldKey.src = hideImg
	}else{
		oldPwdIn.type="password";
		showOldKey.src = eyeImg
	}
	keyStrength(oldPwdIn.value.trim(),'oldPwd')
}

//same, for decoy In box
function showDecoyPwdIn(){
	var decoyBoxIn = document.getElementById('decoyPwdIn');
	if(decoyBoxIn.type=="password"){
		decoyBoxIn.type="text";
		showDecoyInCheck.src = hideImg
	}else{
		decoyBoxIn.type="password";
		showDecoyInCheck.src = eyeImg
	}
	keyStrength(decoyBoxIn.value.trim(),'decoyIn')
}

//same, for decoy Out box
function showDecoyPwdOut(){
	var decoyBoxOut = document.getElementById('decoyPwdOut');
	if(decoyBoxOut.type=="password"){
		decoyBoxOut.type="text";
		showDecoyOutCheck.src = hideImg
	}else{
		decoyBoxOut.type="password";
		showDecoyOutCheck.src = eyeImg
	}
	keyStrength(decoyBoxOut.value.trim(),'decoyOut')
}

//to switch between basic and advanced interface in the Compose dialog
function switchButtons(){
	if(encodeURI(interfaceBtn.textContent) == "%E2%96%BA"){		//right arrow character
		moreComposeButtons.style.display = '';
		checkBoxes.style.display = '';
//		interfaceBtn.innerHTML = '&#9668;';
		interfaceBtn.textContent = '\u25C4';
		toolBar1.style.display = 'block';
		composeBox.style.borderTopLeftRadius = '0';
		composeBox.style.borderTopRightRadius = '0';
		composeMsg.textContent = "Now type in your message or load images and files, check your options, and click the appropriate Encrypt button"
	}else{
		moreComposeButtons.style.display = 'none';
		checkBoxes.style.display = 'none';
//		interfaceBtn.innerHTML = '&#9658;';
		interfaceBtn.textContent = '\u25BA';
		toolBar1.style.display = 'none';
		composeBox.style.borderTopLeftRadius = '15px';
		composeBox.style.borderTopRightRadius = '15px';
		composeMsg.textContent = "Now type in your message and click Encrypt to email. More options with the arrow"
	}
}

//ditto for the Read dialog
function switchReadButtons(){
	if(encodeURI(readInterfaceBtn.textContent) == "%E2%96%BA"){
		moreReadButtons.style.display = '';
//		readInterfaceBtn.innerHTML = '&#9668;';
		readInterfaceBtn.textContent = '\u25C4';
		readMsg.textContent = "Click the big button to decrypt a file or an image, the small one to reveal a hidden message"
	}else{
		moreReadButtons.style.display = 'none';
//		readInterfaceBtn.innerHTML = '&#9658;';
		readInterfaceBtn.textContent = '\u25BA';
		readMsg.textContent = "Click the arrow to decrypt attachments or reveal a hidden message"
	}
}

var allNew = false
//removes some buttons in the Compose dialog depending on the recipients' list
function updateComposeButtons(emailList){
	allNew = true;	
	for (var index = 0; index < emailList.length; index++){		//scan email array to separate those in the directory from those that are not
		if(locDir[emailList[index].trim()]) allNew = false
	}
	if(emailList.length == 0){moveBtn.style.display = '';}else{moveBtn.style.display = 'none';}		//display backup button in Firefox
	if(allNew){
		encryptBtn.style.display = 'none';
		moreComposeButtons.style.display = 'none';
		inviteBtn.style.display = '';
		interfaceBtn.style.display = 'none';
		checkBoxes.style.display = 'none';
		if(!firstTimeUser) setTimeout(function(){composeMsg.textContent = 'None of these recipients are in your directory. You should send them an invitation first. The contents WILL NOT BE SECURE';},20)
	}else{
		inviteBtn.style.display = 'none';
		interfaceBtn.style.display = '';
		encryptBtn.style.display = '';
		if(encodeURI(interfaceBtn.textContent) == "%E2%96%BA"){
			moreComposeButtons.style.display = 'none';
			checkBoxes.style.display = 'none';
			checkBoxes.style.display = 'none'
		}else{
			moreComposeButtons.style.display = '';
			checkBoxes.style.display = '';
			checkBoxes.style.display = ''
		}
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
		myPwd.value = '';
		myKey = '';
		oldPwdStr = '';
		imagePwd.value = ''
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		myPwd.value = '';
		myKey = '';
		oldPwdStr = '';
		imagePwd.value = ''
	}
    keytime = new Date().getTime()
}

//converts user Password into binary format, resumes operation
function acceptKey(){
	var key = myPwd.value.trim();
	if(key == ''){
		keyMsg.textContent = 'Please enter your Password';
		return
	}
	if(key.length < 4){
		keyMsg.textContent = 'This Password is too short';
		return
	}
	keyMsg.textContent = '';
	var blinker = document.createElement('span'),
		msgText = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = "LOADING...";
	msgText.textContent = " for best speed, use at least a Medium Password";
	keyMsg.appendChild(blinker);
	keyMsg.appendChild(msgText);

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
		firstTimeKey.style.display = 'none';
		resetTimer();
		$('#keyScr').dialog("close");
		myPwd.value = '';
		if (callKey == 'encrypt'){					//now complete whatever was being done when the Password was found missing
			encrypt()
		}else if(callKey == 'encrypt2file'){
			encrypt2file()
		}else if(callKey == 'encrypt2image'){
			encrypt2image()
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
		keyMsg.textContent = "This is not the same Password as last time. If you click OK again, it will be accepted as your new Password";
		acceptKeyBtn.style.background = '#FB5216';
		acceptKeyBtn.style.color = 'white';
		setTimeout(function() {
			newPwdAccepted = false;
			acceptKeyBtn.style.background = '';
			acceptKeyBtn.style.color = ''
		}, 10000)								//forget request after 10 seconds
		return
	}else{															//new Password accepted, so store it and move on
		newPwdAccepted = false
	}
}

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

//to blink text
function blinker() {
    $('.blink').fadeOut(500);
    $('.blink').fadeIn(500);
}
setInterval(blinker, 1000); //Runs every second

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
	fileReader.readAsDataURL(fileToLoad, "UTF-8")
}

//loads a file or image from the read dialog and starts decryption
function loadEncryptedFile(){
	if(!myKey){
		showKeyDialog();
		return
	}
	var fileToLoad = loadEncrFile.files[0];
	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) == "data:image"){						//if it's an image, trigger image decryption
			previewImg.onload = function(){
				encodePNGBtn.style.display = 'none';
				encodeJPGBtn.style.display = 'none';
				decodeImgBtn.style.display = '';
				
				//populate the image Password box
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
	if(!myKey){
		showKeyDialog();
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
		encrypt2image();
		
		//try to populate the image Password box
		var reg = new RegExp(myEmail,'g'),
			emailArray = composeRecipientsBox.textContent.replace(reg,'').split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		emailArray = emailArray.filter(Boolean);
		if(emailArray.length == 1){
			imagePwd.value = nacl.util.encodeBase64(makeShared(convertPubStr(locDir[emailArray[0]][0]),myKey)).replace(/=+$/,'')
		}else{
			imagePwd.value = ''
		}
		
		updateCapacity();
		showImageDialog()
	}
}