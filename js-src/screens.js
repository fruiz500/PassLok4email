//to insert encrypted data into email page
function insertInBody(node){
	chrome.tabs.sendMessage(activeTab.id, {message: "encrypted_data", composeHTML: node.outerHTML});
}

//to view only one screen
function openScreen(name){
	var screens = document.querySelectorAll(".screen")
	for(var i = 0 ; i < screens.length; i++){
		screens[i].style.display = 'none'
	}
	document.getElementById(name).style.display = 'block';
	if(name == 'pwdScr' || name == 'oldPwdScr' || name == 'decoyInScr' || name == 'decoyOutScr' || name == 'stegoImageScr' || name == 'symmetricScr'){
		document.getElementById(name.slice(0,-3) + 'Box').focus()
	}else if(name == 'composeScr'){
		composeBox.focus()
	}
	setTimeout(function(){resizeWindow(name)},100)						//add a delay to make sure all changes are in before the resizing happens
}

//for the specific case of the read screen
function openReadScreen(){
	if(readScr.style.display != 'block'){
		openScreen('readScr')
	}else{
		resizeWindow('readScr')
	}
}

//resizes screens to fit the content
function resizeWindow(name){
	var contentWidth = 640;

	var contentHeight = document.getElementById(name).offsetHeight + 50;
	window.resizeTo(contentWidth,contentHeight)
}

//start blinking message, for Msg elements
function blinkMsg(element){
	element.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	element.appendChild(blinker)
}

var hideImg = '/img/hideImg.png', eyeImg = '/img/eyeImg.png';

//this is for showing and hiding text in password input boxes
function showPwd(name){
	var pwdIn = document.getElementById(name + 'Box'),
		icon = document.getElementById(name + 'Icon');
	if(pwdIn.type=="password"){
		pwdIn.type="text";
		icon.src = hideImg
	}else{
		pwdIn.type="password";
		icon.src = eyeImg
	}
	keyStrength(pwdIn.value.trim(),name)
}

//to switch between basic and advanced interface in the Compose screen
function switchButtons(){
	if(encodeURI(interfaceBtn.textContent) == "%E2%96%BA"){		//right arrow character
		moreComposeButtons.style.display = '';
		checkBoxes.style.display = '';
//		interfaceBtn.innerHTML = '&#9668;';		//remember the code
		interfaceBtn.textContent = '\u25C4';
		composeMsg.textContent = "Type in your message, set options, and click an Encrypt button"
	}else{
		moreComposeButtons.style.display = 'none';
		checkBoxes.style.display = 'none';
//		interfaceBtn.innerHTML = '&#9658;';
		interfaceBtn.textContent = '\u25BA';
		composeMsg.textContent = "Type in your message and click Encrypt to email. More options with the arrow"
	}
	resizeWindow('composeScr')
}

//ditto for the Read dialog
function switchReadButtons(){
	if(encodeURI(readInterfaceBtn.textContent) == "%E2%96%BA"){
		moreReadButtons.style.display = '';
//		readInterfaceBtn.innerHTML = '&#9668;';
		readInterfaceBtn.textContent = '\u25C4';
		readMsg.textContent = "Click the first new button to decrypt a file or an image, the second to reveal a hidden message, the third to display your Lock"
	}else{
		moreReadButtons.style.display = 'none';
//		readInterfaceBtn.innerHTML = '&#9658;';
		readInterfaceBtn.textContent = '\u25BA';
		readMsg.textContent = "Click the arrow to decrypt attachments, reveal a hidden message, or display your Lock"
	}
}

var allNew = false;

//removes some buttons in the Compose dialog depending on the recipients' list
function updateComposeButtons(){
	allNew = true;	
	for (var index = 0; index < emailList.length; index++){		//scan email array to separate those in the directory from those that are not
		if(locDir[emailList[index].trim()]) allNew = false
	}
	if(emailList.length == 0){									//display backup button for no recipients
		moveBtn.style.display = 'inline';
		encryptBtn.style.display = 'none';
		inviteBtn.style.display = 'none';
		composeMsg.textContent = "Click the Backup button to make a backup file that you can load on a different machine";
		return
	}else{moveBtn.style.display = 'none'}
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

//accepts old Password and restarts interrupted process
function acceptoldPwd(){
	oldPwdStr = oldPwdBox.value.trim();
	oldPwdBox.value = '';
	if(callKey == 'encrypt'){
		encrypt()
	}else if(callKey == 'encrypt2file'){
		encrypt2file()
	}else if(callKey == 'decrypt'){
		decrypt()
	}
}

//finish what was being done when the cover box was found empty
function acceptCover(){
	if (callKey == 'encrypt'){
		encrypt()
	}else if(callKey == 'encrypt2file'){
		encrypt2file()
	}
}

//these do the same as the dialog close button, plus they display appropriate messages
function cancelName(){
	readMsg.textContent = 'Name input canceled';
	openScreen('readScr')
}

function cancelOldPwd(){
	readMsg.textContent = 'Old Password canceled';
	oldPwdBox.value = '';
	openScreen('readScr')
}

function cancelChat(){
	composeMsg.textContent = 'Chat canceled';
	chatDate.value = '';
	openScreen('composeScr')
}

function cancelAcceptChat(){
	chatMsg2.textContent = '';
	readMsg.textContent = 'Chat canceled';
	readBox.textContent = '';
	openScreen('readScr')
}

function cancelStego(){
	composeMsg.textContent = 'Hiding canceled';
	coverBox.value = '';
	visibleMode.checked = true;
	openScreen('composeScr')
}

function cancelsymmetric(){
	symmetricBox.value = '';
	if(callKey == 'decrypt'){
		readMsg.textContent = 'Shared Password decryption canceled';
		openScreen('readScr')
	}else{
		composeMsg.textContent = 'Shared Password encryption canceled';
		openScreen('composeScr')
	}
	callKey = ''
}

var sharedPwd = '';				//used in symmetric encryption and decryption

function acceptsymmetric(){
	sharedPwd = symmetricBox.value.trim();
	symmetricBox.value = '';
	if(callKey == 'encrypt'){					//now complete whatever was being done when the password was found missing
		encrypt()
	}else if(callKey == 'encrypt2file'){
		encrypt2file()
	}else if(callKey == 'encrypt2image'){
		encrypt2image()
	}else if(callKey == 'decrypt'){
		decrypt()
	}
}

//opens screen to store new Lock obtained through a message
function openNewLock(){
	nameMsg.textContent = 'This message from ' + theirEmail + ' was locked with a new Password. Click OK if you wish to accept it.';
	openScreen('nameScr')
}

function acceptdecoyIn(){			//"decoy" is not capitalized because of boxKeyUp function
	encrypt()
}

function acceptdecoyOut(){
	doDecoyDecrypt()
}

function cancelDecoyIn(){
	composeMsg.textContent = 'Decoy encryption canceled';
	decoyText.value = '';
	decoyInBox.value = '';
	openScreen('composeScr')
}

function cancelDecoyOut(){
	readMsg.textContent = 'Decoy decryption canceled';
	decoyOutBox.value = '';
	openScreen('readScr')
}

function showImageDecrypt(){
	encodePNGBtn.style.display = 'none';
	encodeJPGBtn.style.display = 'none';
	decodeImgBtn.style.display = '';
	stegoImageMsg.textContent = "Load the image with the first button, then write the Password if any, and click Decrypt";
	openScreen('stegoImageScr')
}

//generic function to evaluate key strength and execute on Enter. Possible names are: pwd, oldPwd, decoyIn, decoyOut, imagePwd
function boxKeyup(name,evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){
		window['accept' + name]()
	}else{
		return keyStrength(document.getElementById(name + 'Box').value, name)
	}
}

//writes five random dictionary words in the Password box
function suggestPwd(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwdBox.type="text";
	pwdBox.value = output.trim();
	pwdIcon.src = hideImg;
	keyStrength(output.trim(),true)
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); composeBox.focus()
}

var firstTimeUser = false;

//special instructions displayed on first run
function introGreeting(){
	firstTimeKey.style.display = 'block';
	pwdMsg.textContent = 'The strength will appear here\nEnter the Password and click OK';
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
		if(fileToLoad.type.slice(0,4) == "text"){
			composeBox.innerHTML += "<br><br>" + URLFromFileLoaded.replace(/  /g,' &nbsp;')
		}else{
			composeBox.innerHTML += '<br><a download="' + escapedName + '" href="' + decryptSanitizer(URLFromFileLoaded) + '">' + escapedName + '</a>'
		}
		mainFile.type = '';
        mainFile.type = 'file'            //reset file input
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
		composeBox.innerHTML += decryptSanitizer('<img src="' + URLFromFileLoaded.replace(/=+$/,'') + '">');
		imgFile.type = '';
        imgFile.type = 'file'            //reset file input
	};
	fileReader.readAsDataURL(fileToLoad, "UTF-8")
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
				
				//populate the image Password box
				var reg = new RegExp(myEmail,'g'),
					filteredEmail = senderBox.textContent.replace(reg,'').trim();
				if(symMode.checked && sharedPwd){
					stegoImageBox.value = sharedPwd;
					sharedPwd = ''
				}else if(filteredEmail && soleRecipient){									//don't do it unless I am the only recipient
					if(!refreshKey()) return;											//make sure the key is loaded, otherwise stop to get it
					stegoImageBox.value = nacl.util.encodeBase64(makeShared(convertPubStr(locDir[filteredEmail][0]),myKey)).replace(/=+$/,'');
					stegoImageMsg.textContent =  'The image Password has been pre-filled since you are the only recipient. Check and click Decrypt';
				}else{
					stegoImageBox.value = '';
					stegoImageMsg.textContent =  'Now type in the Password, if any, and click Decrypt'
				}
				openScreen('stegoImageScr')
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
		loadEncrFile.type = '';
        loadEncrFile.type = 'file'            //reset file input
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
	  if(stegoImageScr.style.display == 'none'){
		encodePNGBtn.style.display = '';
		encodeJPGBtn.style.display = '';
		decodeImgBtn.style.display = 'none';
		encrypt2image();
		
		//try to populate the image Password box
		var reg = new RegExp(myEmail,'g'),
			emailArray = composeRecipientsBox.textContent.replace(reg,'').split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		emailArray = emailArray.filter(Boolean);
		if(symMode.checked && !sharedPwd){
			openScreen('symmetricScr');
			return
		}else if(symMode.checked && sharedPwd){
			stegoImageBox.value = sharedPwd;
			sharedPwd = ''
		}else if(emailArray.length == 1){
			if(!refreshKey()) return;											//make sure the key is loaded, otherwise stop to get it
			stegoImageBox.value = nacl.util.encodeBase64(makeShared(convertPubStr(locDir[emailArray[0]][0]),myKey)).replace(/=+$/,'')
		}else{
			stegoImageBox.value = ''
		}
		
		updateCapacity();
		openScreen('stegoImageScr')
	  }
	}
}

//operates when the Save button is clicked
function saveFiles(boxId,isEditable){
	var element = document.getElementById(boxId);
	if(!element) return;
 	if(isEditable) element.contentEditable = 'false';
    var files = element.querySelectorAll('a'),
        length = files.length;				//since files will be loaded as links in the main box
    for(var i = 0; i < length; i++){		//download all files
        if(files[i].href.includes('data:')) files[i].click()
    }
    if(isEditable) element.contentEditable = 'true'
}