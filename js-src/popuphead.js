//this part from the original screens.js
//start blinking message, for Msg elements
/*
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
		showKey.src = '../img/hideImg.png'
	}else{
		pwdIn.type="password";
		showKey.src = '../img/eyeImg.png'
	}
	keyStrength(pwdIn.value.trim(),'pwd')
}

//same, for old Key box
function showOldSec(){
	var oldPwdIn = document.getElementById('oldPwdBox');
	if(oldPwdIn.type=="password"){
		oldPwdIn.type="text";
		showOldKey.src = '../img/hideImg.png'
	}else{
		oldPwdIn.type="password";
		showOldKey.src = '../img/eyeImg.png'
	}
	keyStrength(oldPwdIn.value.trim(),'oldPwd')
}

//same, for decoy In box
function showDecoyPwdIn(){
	var decoyBoxIn = document.getElementById('decoyPwdIn');
	if(decoyBoxIn.type=="password"){
		decoyBoxIn.type="text";
		showDecoyInCheck.src = '../img/hideImg.png'
	}else{
		decoyBoxIn.type="password";
		showDecoyInCheck.src = '../img/eyeImg.png'
	}
	keyStrength(decoyBoxIn.value.trim(),'decoyIn')
}

//same, for decoy Out box
function showDecoyPwdOut(){
	var decoyBoxOut = document.getElementById('decoyPwdOut');
	if(decoyBoxOut.type=="password"){
		decoyBoxOut.type="text";
		showDecoyOutCheck.src = '../img/hideImg.png'
	}else{
		decoyBoxOut.type="password";
		showDecoyOutCheck.src = '../img/eyeImg.png'
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
	resizeWindow('composeScr')
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
//	allNew = true;	
//	for (var index = 0; index < emailList.length; index++){		//scan email array to separate those in the directory from those that are not
//		if(locDir[emailList[index].trim()]) allNew = false
//	}
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

//this function erases the secret values on the DOM after 5 minutes. Parallel to similar function to erase global variables in the background page
function resetTimer(){
	var period = 300000;
	clearTimeout(keytimer);

	//start timer to reset Password box
	keytimer = setTimeout(function() {
		myPwd.value = '';
//		myKey = '';
//		oldPwdStr = '';
		imagePwd.value = ''
	}, period);

	//erase key at end of period, by a different way
	if ((new Date().getTime() - keytime > period)) {
		myPwd.value = '';
//		myKey = '';
//		oldPwdStr = '';
		imagePwd.value = ''
	}
    keytime = new Date().getTime()
}

//converts user Password into binary format, resumes operation
function acceptKey(){
	var key = myPwd.value.trim();
//	myPwd.value = '';
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
	
	//now send the password to the background script and  wait to close the window until it accepts it as good
	chrome.runtime.sendMessage({message: "got_pwd", pwd: key})
	chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {                   
			if(request.message == "pwd_accepted"){
//				window.close()
			}else if(request.message == "pwd_rejected"){
				keyMsg.textContent = "This is not the same Password as last time. If you click OK again, it will be accepted as your new Password";
				acceptKeyBtn.style.background = '#FB5216';
				acceptKeyBtn.style.color = 'white';
				setTimeout(function() {
//					newPwdAccepted = false;
					acceptKeyBtn.style.background = '';
					acceptKeyBtn.style.color = ''
				}, 10000)								//forget request after 10 seconds
			}
      }
	);
}
*/

//this to be moved to background page
/*
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
*/
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

/*
//to blink text, using jQuery function
function blinker() {
    $('.blink').fadeOut(500);
    $('.blink').fadeIn(500);
}
setInterval(blinker, 1000); //Runs every second
*/

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
//	if(!myKey){
//		showKeyDialog();
//		return
//	}
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
//			chrome.runtime.sendMessage({message: 'decrypt_file', text2decrypt: URLFromFileLoaded.split(',')[1].replace(/=+$/,'')})
		}else{
			text2decrypt = URLFromFileLoaded;									//text case
			decrypt()
//			chrome.runtime.sendMessage({message: 'decrypt_file', text2decrypt: URLFromFileLoaded})
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
//	if(!myKey){
//		showKeyDialog();
//		return
//	}
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
/*		var reg = new RegExp(myEmail,'g'),
			emailArray = composeRecipientsBox.textContent.replace(reg,'').split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		emailArray = emailArray.filter(Boolean);
		if(emailArray.length == 1){
			imagePwd.value = nacl.util.encodeBase64(makeShared(convertPubStr(locDir[emailArray[0]][0]),myKey)).replace(/=+$/,'')
		}else{  */
			imagePwd.value = ''
//		}
		
		updateCapacity();
//		showImageDialog()
		openScreen('stegoImageScr');
		resizeWindow('stegoImageScr')
	}
}
/*
//for buttons, so they send things to the background page
function resetPFS(){}

function doDecoyDecrypt(){
	chrome.runtime.sendMessage({message: "decoy_decrypt", decoyPwd: decoyPwdOut.value.trim()})
}

function decryptImageFile(){}

//master encrypt function, which sends stuff to the encrypt function. The email list is known beforehand.
function encrypt(){
	if(composeBox.innerHTML.replace(/<(.*?)>/gi,"")){
		chrome.runtime.sendMessage({message: "encrypt", composeHTML: composeBox.innerHTML, stegoMode: stegoMode.checked, invisibleMode: invisibleMode.checked, chatMode: chatMode.checked, onceMode: onceMode.checked, decoyMode: decoyMode.checked})
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

function encrypt2file(){
	if(composeBox.innerHTML.replace(/<(.*?)>/gi,"")){
		chrome.runtime.sendMessage({message: "encrypt2file", composeHTML: composeBox.innerHTML, stegoMode: stegoMode.checked, invisibleMode: invisibleMode.checked, chatMode: chatMode.checked, onceMode: onceMode.checked, decoyMode: decoyMode.checked, textMode: textMode.checked})
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

function encrypt2image(){
	if(composeBox.innerHTML.replace(/<(.*?)>/gi,"")){
		chrome.runtime.sendMessage({message: "encrypt2image", composeHTML: composeBox.innerHTML, stegoMode: stegoMode.checked, invisibleMode: invisibleMode.checked, chatMode: chatMode.checked, onceMode: onceMode.checked, decoyMode: decoyMode.checked})
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

var inviteRequested = false;
function inviteEncrypt(){
	if(!inviteRequested){				//sets flag so action happens on next click
		inviteRequested = true;
		composeMsg.textContent = "If you click *Invite* again, the contents of the box will be encrypted and added to a special invitation message. This message can be decrypted by anyone and is ";
		var blinker = document.createElement('span');
		blinker.className = "blink";
		blinker.textContent = "NOT SECURE";
		composeMsg.appendChild(blinker);
		inviteBtn.style.background = '#FB5216';
		setTimeout(function() {
			inviteRequested = false;
			inviteBtn.style.background = '#3896F9';
		}, 15000)								//forget request after 15 seconds

	}else{
		inviteRequested = false;
		chrome.runtime.sendMessage({message: "invite", composeHTML: composeBox.innerHTML})
	}
}

function resetPFS2(){}
function moveDB(){}
function storeNewLock(){}
function makeChat(){}
function charsLeftChat(){}
function acceptChat(){}
function charsLeftDecoy(){}
function encodePNG(){}
function encodeJPG(){}
function decodeImage(){}

//more functions
//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	var entropy = entropycalc(pwd);
	
if(display){
	if(entropy == 0){
		var msg = 'This is a known bad Key!';
		var colorName = 'magenta'
	}else if(entropy < 20){
		var msg = 'Terrible!';
		var colorName = 'magenta'
	}else if(entropy < 40){
		var msg = 'Weak!';
		var colorName = 'red'
	}else if(entropy < 60){
		var msg = 'Medium';
		var colorName = 'darkorange'
	}else if(entropy < 90){
		var msg = 'Good!';
		var colorName = 'green'
	}else if(entropy < 120){
		var msg = 'Great!';
		var colorName = 'blue'
	}else{
		var msg = 'Overkill  !';
		var colorName = 'cyan'
	}
}

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

	var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds

	if(pwd.trim() == ''){
		if(decoyInScr.style.display == "block" || decoyOutScr.style.display == "block"){
			msg = 'Enter the Hidden message Key/Lock below'
		}else{
			msg = 'Enter your Key'
		}
	}else{
//		if(BasicButtons){
//			msg = 'Key strength: ' + msg + '. Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
//		}else{
			msg = 'Key entropy: ' + Math.round(entropy*100)/100 + ' bits. ' + msg + '. Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
//		}
	}
if(display){											//these are to display the appropriate messages
	var msgName = '';
	if(keyScr.style.display != "none") msgName = 'keyMsg';
	if(decoyInScr.style.display == "block") msgName = 'decoyMsg';
	if(decoyOutScr.style.display == "block") msgName = 'decoyOutMsg';
//	if(introscr3.style.display == "block") msgName = 'introMsg';
//	if(keyChange.style.display == "block") msgName = 'keyChangeMsg';
	if(stegoImageScr.style.display == "block") msgName = 'stegoImageMsg';
//	if(synthPass.style.display == "block") msgName = 'synthMsg';		//these two for the synth interface
//	if(c5.style.display == "block") msgName = 'helpMsg';
	
	if(pwd){
		document.getElementById(msgName).textContent = msg;
		hashili(msgName,pwd);
		document.getElementById(msgName).style.color = colorName
	}else{
		document.getElementById(msgName).textContent = "Enter your Key";
		document.getElementById(msgName).style.color = ''
	}

	if(isSynthHelp){								//same, for synthPass interface
		var msgSpan = document.createElement('span');
		msgSpan.id = "pwdMsgHelp";
		msgSpan.textContent = msg;
		synthHelpMsg.textContent = '';
		synthHelpMsg.appendChild(msgSpan);
		hashili('synthHelpMsg',pwd);
		document.getElementById('pwdMsgHelp').style.color = colorName;
	}else if(synthPass.style.display == 'block'){
		var msgSpan = document.createElement('span');
		msgSpan.id = "pwdMsg";
		msgSpan.textContent = msg;
		synthMsg.textContent = '';
		synthMsg.appendChild(msgSpan);
		document.getElementById('pwdMsg').style.color = colorName
		}
	}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u')
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
var vowel = 'aeiou',
	consonant = 'bcdfghjklmnprstvwxyz',
	hashiliTimer;
function hashili(msgID,string){
	var element = document.getElementById(msgID);
	clearTimeout(hashiliTimer);
	hashiliTimer = setTimeout(function(){
		if(!string.trim()){
			element.innerText += ''
		}else{
			var code = nacl.hash(nacl.util.decodeUTF8(string.trim())).slice(-2),			//take last 4 bytes of the SHA512		
				code10 = ((code[0]*256)+code[1]) % 10000,		//convert to decimal
				output = '';

			for(var i = 0; i < 2; i++){
				var remainder = code10 % 100;								//there are 5 vowels and 20 consonants; encode every 2 digits into a pair
				output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
				code10 = (code10 - remainder) / 100
			}
//	return output
			element.innerText += '\n' + output
		}
	}, 1000);						//one second delay to display hashili
}
*/
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
//	retrieveAllSync();
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
	chrome.runtime.sendMessage({message: 'reset_now'})
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

/*
//show how much text can be hidden in the image
function updateCapacity(){
  if(decodeImgBtn.style.display == 'none'){						//do this calculation only when encoding, not when decoding
	var	textsize = composeBox.textContent.length;

	blinkMsg(stegoImageMsg);
	setTimeout(function(){																				//give it 2 seconds to complete
		if(stegoImageMsg.textContent == 'PROCESSING') stegoImageMsg.textContent = 'There was an error calculating the capacity, but the image is still usable'
	},2000)

  setTimeout(function(){
	 //start measuring png capacity. Subtract 4 bits used to encode k, 48 for the end marker
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = document.getElementById('previewImg').naturalWidth;
	shadowCanvas.height = document.getElementById('previewImg').naturalHeight;
	shadowCtx.drawImage(document.getElementById('previewImg'), 0, 0, shadowCanvas.width, shadowCanvas.height);
	
	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		opaquePixels = 0;
	for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
		if(imageData.data[i] == 255) opaquePixels++					//use pixels with full opacity only
	}
	var pngChars = Math.floor((opaquePixels * 3 - 270) / 6); 
	  
	//now measure jpeg capacity
	if(document.getElementById('previewImg').src.slice(11,15) == 'jpeg'){					//true jpeg capacity calculation,
		var lumaCoefficients = [],
			count = 0;
		jsSteg.getCoefficients(document.getElementById('previewImg').src, function(coefficients){
			var subSampling = 1;
			for(var index = 1; index <= 3; index++){						//first luma, then chroma channels, index 0 is always empty
				lumaCoefficients = coefficients[index];
				if(lumaCoefficients){
					if(index != 1) subSampling = Math.floor(coefficients[1].length / lumaCoefficients.length);
	 	 			for (var i = 0; i < lumaCoefficients.length; i++) {
						for (var j = 0; j < 64; j++) {
							if(lumaCoefficients[i][j] != 0) count += subSampling		//if subsampled, multiply the count since it won't be upon re-encoding
   	 					}
					}
					if(index == 1) var firstCount = count
				}else{
					count += firstCount													//repeat count if the channel appears not to exist (bug in js-steg)
				}
			}
			var jpgChars = Math.floor((count - 270) / 6);			//base64 version, 4 bits used to encode k, 48 for the end marker, 270 buffer for second message

			stegoImageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, ' + jpgChars + ' as JPG. We have ' + textsize + ' characters'
		})
	}else{															//no jpeg, so estimate capacity
		var jpgChars = Math.floor(pngChars / 20);		//base64 version

		stegoImageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, at least ' + jpgChars + ' as JPG. We have ' + textsize + ' characters'
	}
  },30)					//end of timeout

  }else{
	stegoImageMsg.textContent = 'Now type in the Password, if any, and click Decrypt'
  }
}*/