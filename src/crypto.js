//selects the encryption mode and starts it
function encrypt(){
	callKey = 'encrypt';
	if(stegoMode.checked){var lengthLimit = 10000}else{var lengthLimit = 71000};
	if(!chatMode.checked && composeBox.innerHTML.length > lengthLimit){
		var reply = confirm("This item is too long to be encrypted directly into the email and likely will be clipped by the server, rendering it undecryptable. We suggest to cancel and instead encrypt to file or to image, then attach the resulting file to your email");
		if(!reply) return
	}
	if(stegoMode.checked) enterCover();
	if(chatMode.checked){
		displayChat()
	}else if(composeBox.innerHTML){
		resetTimer();
		if(!myKey){
			showKeyDialog();
			return
		}
		var emailArray = composeRecipientsBox.textContent.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,false,false);
		isChatInvite = false
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

//selects the encryption mode and starts it, but outputs to file instead. Chat not an option
function encrypt2file(){
	callKey = 'encrypt2file';
	if(chatMode.checked){
		displayChat()
	}else if(composeBox.textContent){
		resetTimer();
		if(!myKey){
			showKeyDialog();
			return
		}
		if(stegoMode.checked) enterCover();
		var emailArray = composeRecipientsBox.textContent.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,true,false);
		isChatInvite = false
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

//selects the encryption mode and starts it, but outputs to image instead
function encrypt2image(){
	callKey = 'encrypt2image';
	if(chatMode.checked){
		displayChat()
	}else{
		resetTimer();
		if(!myKey){
			showKeyDialog();
			return
		}
		var emailArray = composeRecipientsBox.textContent.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,false,true);
		isChatInvite = false
	}
}

var text2decrypt = '';	
//function that starts it all when the read screen loads
function decrypt(){
	callKey = 'decrypt';
	resetTimer();
	if(!myKey){
		showKeyDialog();
		return
	}
	var text = text2decrypt;
	text = text.replace(/<(.*?)>/gi,"");
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')) fromLetters(text);		//if hidden text
	if(text.match('\u00ad')) fromInvisible(text);
	if(text2decrypt.match('==')) text2decrypt = text2decrypt.split('==')[1];
	decryptList();
	openChat()
}

//concatenates two uint8 arrays, normally used right before displaying the output
function concatUint8Arrays(array1,array2){
	var result = new Uint8Array(array1.length + array2.length);
	result.set(array1,0);
	result.set(array2,array1.length);
	return result
}

var inviteRequested = false;
//make an invitation. This only happens after the second button click
function inviteEncrypt(){
	if(!inviteRequested){				//sets flag so action happens on next click
		inviteRequested = true;
		composeMsg.innerHTML = "If you click <strong>Invite</strong> again, the contents of the box will be encrypted and added to a special invitation message. This message can be decrypted by anyone and is <span class='blink'>NOT SECURE</span>";
		inviteBtn.style.background = '#FB5216';
		setTimeout(function() {
			inviteRequested = false;
			inviteBtn.style.background = '#3896F9';
			callKey = '';
		}, 15000)								//forget request after 15 seconds

	}else{
		callKey = 'inviteEncrypt';
		if(!myKey){
			showKeyDialog();
			return
		}
		var nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
			text = composeBox.innerHTML.trim();

		setTimeout(function(){composeMsg.textContent = "This invitation can be decrypted by anyone"},20);

		var output = myezLock + '//////' + nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,symEncrypt(text,nonce24,myLockbin,true)))).replace(/=+$/,'')
		output = output.match(/.{1,80}/g).join("\n");
		var outNode = document.createElement('div');
		outNode.innerHTML = "<br>The gibberish below contains a message from me that has been encrypted with <b>PassLok for Email</b>. To decrypt it, do this:<ol><li>Install the PassLok for Email extension by following one of these links: <ul><li>Chrome:&nbsp; https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh</li><li>Firefox:&nbsp; https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email/</li></ul></li><li>Reload your email and get back to this message.</li><li>Click the <b>PassLok</b> logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.</li></ol>If you don't use Chrome or Firefox, or don't want to install an extension, you can also open the message in PassLok Privacy, a standalone app available from https://passlok.com/app<br><pre>----------begin invitation message encrypted with PassLok--------==<br><br>" + output + "<br><br>==---------end invitation message encrypted with PassLok-----------</pre>";
		if(typeof(isNewYahoo) == "undefined") outNode.contentEditable = 'true';
		var bodyElement = document.getElementById(bodyID);
		bodyElement.insertBefore(outNode,bodyElement.childNodes[0]);

		$('#composeScr').dialog("close");
		inviteRequested = false;
		callKey = ''
	}
}

//encrypts for a list of recipients, as emails in listArray. First makes a 256-bit message key, then gets the Lock for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's Lock, so he/she can find the right encrypted key
//two modes: Signed, and ReadOnce
function encryptList(listArray,isFileOut,isImageOut){
	var encryptArray = [],
		inviteArray = [],
		myselfOnList = false;
	for (var index = 0; index < listArray.length; index++){		//scan email array to separate those in the directory from those that are not
		var email = listArray[index].trim();
		if (email != ''){
			if(email != myEmail){						//encrypt for myself is added later
				if(locDir[email]){
					if(locDir[email][0]){
						encryptArray.push(email)			//encrypt for these
					}else{
						inviteArray.push(email)
					}
				}else{
					inviteArray.push(email)			//make invites for these
				}
			}
		}
	}
	if(encryptArray.length == 0 && listArray.indexOf(myEmail) == -1){
		composeMsg.textContent = 'None of these recipients are in your directory. You should send them an invitation first.';
		return
	}
	if(!onceMode.checked) encryptArray.push(myEmail);						//copy to myself unless read-once
	encryptArray = shuffle(encryptArray);							//extra precaution
	var recipients = encryptArray.length;

	if(recipients == 0){
		composeMsg.textContent = 'No valid recipients for this mode';
		return
	}else if(recipients > 255){
		composeMsg.textContent = 'Maximum number of recipients is 255';
		return
	}

	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		text = composeBox.innerHTML,
		outString = myezLock + '//////';

	if(onceMode.checked){													//add type marker, nonce, and padding for decoy msg
		var outArray = new Uint8Array(2);	
		outArray[0] = 56;												//will become "O" in base64
		outArray[1] = recipients
	}else{
		var outArray = new Uint8Array(2);	
		outArray[0] = 72;												//will become "S" in base64
		outArray[1] = recipients
	}
		
	var padding = decoyEncrypt(75,myKey);						//this for decoy mode
	if(!padding) return;

	var cipher = symEncrypt(text,nonce24,msgKey,true);					//main encryption event including compression, but don't add the result yet
		
	outArray = concatUint8Arrays(outArray,concatUint8Arrays(nonce,padding));

	//for each email on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext obtained when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (index = 0; index < encryptArray.length; index++){
		email = encryptArray[index];
		if (email != ''){
			if(email == myEmail){
				var Lock = myLock										//string version of myLockbin
			}else{
				var Lock = locDir[email][0]
			}
			if(!onceMode.checked){													//for Signed mode and Chat invites
				var sharedKey = makeShared(convertPubStr(Lock),myKey),
					cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
					idTag = nacl.secretbox(nacl.util.decodeBase64(Lock),nonce24,sharedKey).slice(0,8)
					
			}else{																	//for Read-once mode
				if(email != myEmail){								//can't do Read-once to myself
					var lastKeyCipher = locDir[email][1],
						lastLockCipher = locDir[email][2],				//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
						turnstring = locDir[email][3],
						secdum = nacl.randomBytes(32);							//different dummy key for each recipient

					if(turnstring == 'reset'){
						var typeByte = [172],								//becomes 'r' in base64
							resetMessage = true
					}else if(turnstring == 'unlock'){
						var typeByte = [164],								//becomes 'p' in base64
							pfsMessage = true
					}else{
						var typeByte = [160]								//becomes 'o' in base64
					}
										
					if(lastKeyCipher){
						var lastKey = keyDecrypt(lastKeyCipher,true);
					}else{													//use new dummy Key if stored dummy doesn't exist
						var lastKey = secdum;
						if(!resetMessage){
							typeByte = [164];
							var pfsMessage = true
						}
					}
										
					if(!turnstring){										//initial message to be handled the same as a reset
						typeByte = [172];
						var resetMessage = true
					}

					if(lastLockCipher) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher,true)
					}else{													//use permanent Lock if dummy doesn't exist
						var lastLock = convertPubStr(Lock)
					}

					var sharedKey = makeShared(lastLock,lastKey);
					
					var idKey = makeShared(lastLock,myKey);

					var cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
						idTag = nacl.secretbox(nacl.util.decodeBase64(Lock),nonce24,idKey).slice(0,8);

					if(turnstring != 'lock'){															//if out of turn don't change the dummy Key, this includes reset
						var newLockCipher = nacl.secretbox(makePub(lastKey),nonce24,idKey)
					}else{
						var	newLockCipher = nacl.secretbox(makePub(secdum),nonce24,idKey)
					}
					if(turnstring == 'lock' || !lastKeyCipher){
						locDir[email][1] = keyEncrypt(secdum);											//new Key is stored in the permanent database
					}
					if(turnstring != 'reset') locDir[email][3] = 'unlock';
					
				}else{
					if(encryptArray.length < 2){
						composeMsg.textContent = 'In Read-once mode, you must select recipients other than yourself.';
						return
					}
				}
			}
			if(onceMode.checked){
				if(email != myEmail) outArray = concatUint8Arrays(outArray,concatUint8Arrays(idTag,concatUint8Arrays(cipher2,concatUint8Arrays(typeByte,newLockCipher))))
			}else{
				outArray = concatUint8Arrays(outArray,concatUint8Arrays(idTag,cipher2))
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString += nacl.util.encodeBase64(concatUint8Arrays(outArray,cipher)).replace(/=+$/,'');
	var outNode = document.createElement('div');								//output node not sanitized because it is made by encryption
	
if(!isImageOut){																//normal output, not to image
	if(stegoMode.checked){
		outString = textStego(outString)
	}else if(invisibleMode.checked){
		outString = invisibleStego(outString)
	}

	if(isFileOut && !invisibleMode.checked){									//output to File
		if(stegoMode.checked){
			outNode.innerHTML = '<a download="ChangeMe.txt" href="data:,' + outString + '"><b>PassLok Hidden message; right-click and select Save Link As... Make sure to change the name</b></a>'
		}else if(onceMode.checked){
			if(textMode.checked){
				outNode.innerHTML = '<a download="PLmso.txt" href="data:,' + outString + '"><b>PassLok Read-once message as a text file; right-click and choose Save Link As...</b></a>'
			}else{
				outNode.innerHTML = '<a download="PLmso.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok Read-once message as a binary file; right-click and choose Save Link As...</b></a>'
			}
		}else{
			if(textMode.checked){
				outNode.innerHTML = '<a download="PLmss.txt" href="data:,' + outString + '"><b>PassLok Signed message as a text file; right-click and choose Save Link As...</b></a>'
			}else{
				outNode.innerHTML = '<a download="PLmss.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>PassLok Signed message as a binary file; right-click and choose Save Link As...</b></a>'
			}
		}
	}else{																		//output to email page
		if(stegoMode.checked){
			outNode.textContent = outString
		}else if(invisibleMode.checked){
			outNode.innerHTML = 'Invisible message at the end of the introduction below this line. Edit as needed and remove this notice:<br><br>Dear friend,' + outString + '<br><br>Body of the message.'
		}else{
			if(onceMode.checked){
				outNode.innerHTML = '<pre>----------begin Read-once message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Read-once message encrypted with PassLok-----------</pre>'
			} else if(isChatInvite){
				outNode.innerHTML = '<pre>----------begin Chat invitation encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Chat invitation encrypted with PassLok-----------</pre>'
			} else {
				outNode.innerHTML = '<pre>----------begin Signed message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,80}/g).join("<br>") + '<br><br>==---------end Signed message encrypted with PassLok-----------</pre>'
			}
		}
	}
}else{																			//no extra text if output is to image
	outNode.textContent = outString
}
	if(typeof(isNewYahoo) == "undefined") outNode.contentEditable = 'true';
	syncLocDir();
	callKey = '';
	visibleMode.checked = true;
	decoyMode.checked = false;
	if(isFileOut){
		composeMsg.textContent = "Contents encrypted into a file. Now save it, close this dialog, and attach the file to your email"
		composeBox.textContent = '';
		composeBox.appendChild(outNode)
	}else if(isImageOut){
		composeBox.textContent = '';
		composeBox.appendChild(outNode);
		$('#composeScr').dialog("close");
		showImageDialog();
		encodePNGBtn.style.display = '';
		encodeJPGBtn.style.display = '';
		decodeImgBtn.style.display = 'none';
		if((onceMode.checked && encryptArray.length == 1) || (!onceMode.checked && encryptArray.length < 3)){
			stegoImageMsg.textContent = 'Message encrypted. Now choose an image to hide it into and click either Encrypt to PNG, or Encrypt to JPG. This pre-filled image Password will also be pre-filled on the receiving end.'
		}else{
			stegoImageMsg.textContent = 'Message encrypted. Now choose an image to hide it into and click either Encrypt to PNG, or Encrypt to JPG. For best results, use a Password known to the recipient.'
		}
	}else{
		var bodyElement = document.getElementById(bodyID);
		bodyElement.insertBefore(outNode,bodyElement.childNodes[0])
	}
	if(inviteArray.length != 0){		 
		composeMsg.textContent = 'The following recipients have been removed from your encrypted message because they are not yet in your directory:\n' + inviteArray.join(', ') + '\nYou should send them an invitation first. You may close this dialog now'
	}else if(!isFileOut){
		$('#composeScr').dialog("close")
	}
}

//just to shuffle the array containing the recipients' emails
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x
    }
	return a
}

//encrypts a string or uint8 array with the secret Key, 9 byte nonce. The input can also be binary.
function keyEncrypt(plainstr){
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce);
	if(typeof plainstr == 'string'){
		plainstr = encodeURI(plainstr).replace(/%20/g,' ');
		var cipher = symEncrypt(plainstr,nonce24,myKey,false)
	}else{
		var cipher = nacl.secretbox(plainstr,nonce24,myKey)
	}
	return nacl.util.encodeBase64(concatUint8Arrays([144],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'')		//1st character should be k
}

//decrypts a string encrypted with the secret Key, 12 char nonce. Returns original if not encrypted. If isArray set, return uint8 array
function keyDecrypt(cipherStr,isArray){
	var cipher = nacl.util.decodeBase64(cipherStr);
	if (cipher[0] == 144){
		var	nonce = cipher.slice(1,10),												//ignore the marker byte
			nonce24 = makeNonce24(nonce),
			cipher2 = cipher.slice(10);

		if(isArray){
			var plain = nacl.secretbox.open(cipher2,nonce24,myKey);
			if(!plain){													//failed, try old password
				if(oldPwdStr){
					var oldKeySgn = nacl.sign.keyPair.fromSeed(wiseHash(oldPwdStr,myEmail)).secretKey,
						oldKey = ed2curve.convertSecretKey(oldKeySgn);
					plain = nacl.secretbox.open(cipher2,nonce24,oldKey);
					if(!plain){
						failedDecrypt('old')
					}
				}else{
					failedDecrypt('new')							//this will open the old Password dialog
				}
			}
			return plain
		}else{
			return decodeURI(symDecrypt(cipher2,nonce24,myKey,false).trim())
		}
	}else{
		return cipherStr
	}
}

//this strips initial and final header, plus spaces and non-base64 characters in the middle
function stripHeaders(string){
	string = string.replace(/[\s\n]/g,'').replace(/&nbsp;/g,'');							//remove spaces, newlines
	if(string.match('==')) string = string.split('==')[1];									//keep only PassLok item, if bracketed
	string = string.replace(/<(.*?)>/gi,"").replace(/[^a-zA-Z0-9+\/]/g,''); 		//takes out html tags and anything that is not base64
	return string
}

//to make sure attached Lock is correct
function isBase36(string){
	var result = true;
	for(var i = 0; i < string.length; i++){
		result = result && (base36.indexOf(string.charAt(i)) >= 0)
	}
	return result
}

var padding;			//global variable involved in decoding secret message, needed for decoy decrypt
//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Read-once, or an Invitation. This is detected automatically. It can also be an encrypted database
function decryptList(){
	readBox.textContent = '';
	var text = stripHeaders(text2decrypt);											//get the data from a global variable holding it
	theirEmail = senderBox.textContent.trim();

	if(isBase36(text.slice(0,50)) && (text.slice(50,56) == '//////')){					//find Lock located at the start
		theirLock = changeBase(text.slice(0,50),base36,base64,true)
		
	}else if(text.charAt(0) == 'k'){													//it's an encrypted database, so decrypt it and merge it
		var agree = confirm('This is an encrypted local database. It will be loaded if you click OK, possibly replacing current data. This cannot be undone.');
		if(!agree){
			readBox.textContent = '';
			readMsg.textContent = 'Backup merge canceled';
			return
		}
		var newData = JSON.parse(keyDecrypt(text,false));
		locDir = mergeObjects(locDir,newData);
		syncLocDir();
		readBox.textContent = '';
		readMsg.textContent = 'Data from backup merged';
		return
		
	}else{
		readBox.textContent = '';
		if(encodeURI(readInterfaceBtn.textContent) == "%E2%96%BA"){
			readMsg.textContent = 'This message is not encrypted, but perhaps the images or attachments are. Download them and click the arrow to decrypt them'
		}else{
			readMsg.textContent = 'This message is not encrypted, but perhaps the images or attachments are. Download them and click the big button to decrypt them'
		}
		return
	}

	if(!locDir[theirEmail]){											//make entry if needed
		locDir[theirEmail] = [];
		locDir[theirEmail][0] = theirLock;
		storeData(theirEmail)
	}else if(locDir[theirEmail][0] != theirLock){					//to get permission to change it
		openNewLock()
	}
	
	text = text.slice(56);												//take out ezLock and separator
	
	if(theirLock && !text){
		readMsg.textContent = "This message contains only the sender's Lock. Nothing to decrypt";
		return
	}
	
	var	type = text.charAt(0);

	if(!type.match(/[gSO]/)){
		readBox.textContent = '';
		readMsg.textContent = 'This message is not encrypted, but perhaps the attachments are. Click More to decrypt them';
		return
	}
	
	var cipherInput = nacl.util.decodeBase64(text),
		recipients = cipherInput[1],										//number of recipients. '0' reserved for special cases
		stuffForId = myLockbin;
	if(type == 'g'){
		var nonce = cipherInput.slice(1,10),						//shorter nonce for invitations, no padding
			cipher = cipherInput.slice(10);
		padding = []												//this is global
	}else{
		var nonce = cipherInput.slice(2,17);									//15 bytes
		padding = cipherInput.slice(17, 117);								//100 bytes, global
		cipherInput = cipherInput.slice(117)
	}

	var nonce24 = makeNonce24(nonce);	
	
	//now cut the rest of the input into pieces. First ID tags and their respective encrypted keys etc., then the ciphertext
	var cipherArray = new Array(recipients);
	if(type == 'S'){													//shorter pieces in Anonymous and Signed modes
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(56*i,56*(i+1))		//8 bytes for ID, 48 for encrypted key
		}
		var cipher = cipherInput.slice(56*recipients)
	}else if(type == 'O'){																//longer pieces in Read-once mode
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(105*i,105*(i+1))		//8 bytes for ID, 48 for encrypted ephemeral Lock, 48 for encrypted key, 1 for type
		}
		var cipher = cipherInput.slice(105*recipients)
	}

	if (type == 'O' && theirEmail == myEmail){
		readMsg.textContent = 'You cannot decrypt Read-once messages to yourself';
		return
	}
	if(type == 'S'){														//signed mode
		var sharedKey = makeShared(convertPubStr(theirLock),myKey),
			idKey = sharedKey;

	}else if(type == 'O'){													//Read-once mode
		if (locDir[theirEmail]){
			var	lastKeyCipher = locDir[theirEmail][1],
				lastLockCipher = locDir[theirEmail][2],
				turnstring = locDir[theirEmail][3];									//this strings says whose turn it is to encrypt
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = keyDecrypt(lastKeyCipher,true),
				idKey = makeShared(convertPubStr(theirLock),lastKey);
		}else{																//if a dummy Key doesn't exist, use permanent Key
			var lastKey = myKey,
				idKey = makeShared(convertPubStr(theirLock),myKey);
		}
	}
	
	if(type == 'g'){														//key for Invitation is the sender's Lock, otherwise, got to find it
		var msgKey = nacl.util.decodeBase64(theirLock)
		
	}else{
		var idTag = nacl.secretbox(stuffForId,nonce24,idKey).slice(0,8);

		//look for the id tag and return the bytes that follow it
		for(i = 0; i < recipients; i++){
			var success = true;
			for(var j = 0; j < 8; j++){									//just the first 8 bytes
				success = success && (idTag[j] == cipherArray[i][j])		//find the idTag bytes at the start of cipherArray[i]
			}
			if(success){
				var msgKeycipher = cipherArray[i].slice(8)
			}
		}

		if(typeof(msgKeycipher) == 'undefined'){							//may have been reset, so try again
			if(theirLock){
				lastKey = myKey;
				idKey = makeShared(convertPubStr(theirLock),myKey);
				idTag = nacl.secretbox(stuffForId,nonce24,idKey).slice(0,8);

				for (i = 0; i < recipients; i++){
					var success = true;
					for(var j = 0; j < 8; j++){
						success = success && (idTag[j] == cipherArray[i][j])	
					}
					if (success){
						var msgKeycipher = cipherArray[i].slice(8)
					}
				}
			}
			if(typeof(msgKeycipher) == 'undefined'){						//the password may have changed, so try again with old password
				if(!document.getElementById('oldPwd')){showOldKeyDialog(); return;}
				if(oldPwdStr){
					var oldKeySgn = nacl.sign.keyPair.fromSeed(wiseHash(oldPwdStr,myEmail)).secretKey,
						oldKey = ed2curve.convertSecretKey(oldKeySgn),
						oldLockbin = nacl.sign.keyPair.fromSecretKey(oldKeySgn).publicKey,
						oldLock = nacl.util.encodeBase64(oldLockbin).replace(/=+$/,'');
						
				}else{													//prompt for old password
					$('#oldKeyScr').dialog("open");
					return
				}
				
				if(type == 'S'){
					idKey = makeShared(convertPubStr(theirLock),oldKey)
				}else{
					if(lastKeyCipher){	
						lastKey = keyDecrypt(lastKeyCipher,true);
						idKey = makeShared(convertPubStr(theirLock),lastKey)
					}else{
						lastKey = myKey;
						idKey = makeShared(convertPubStr(theirLock),lastKey)
					}
				}
				idTag = symEncrypt(oldLock,nonce24,idKey).slice(0,8);

				for(i = 0; i < recipients; i++){
					var success = true;
					for(var j = 0; j < 8; j++){
						success = success && (idTag[j] == cipherArray[i][j])	
					}
					if(success){
						var msgKeycipher = cipherArray[i].slice(8)
					}
				}
				if(typeof(msgKeycipher) != 'undefined'){				//got it finally
					if(type == 'S'){
						sharedKey = makeShared(convertPubStr(theirLock),oldKey)
					}
				}else{													//otherwise really give up
					if(type == 'S'){
						failedDecrypt('idSigned')
					}else{
						failedDecrypt('idReadonce')
					}
				}
			}
		}

		//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
		if (type == 'S'){					//signed mode
			var msgKey = nacl.secretbox.open(msgKeycipher,nonce24,sharedKey);
			if(!msgKey) failedDecrypt('signed');

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last byte
		}else{
			var	typeByte = msgKeycipher.slice(48,49),
				newLockCipher = msgKeycipher.slice(49),
				newLock = nacl.secretbox.open(newLockCipher,nonce24,idKey);
			msgKeycipher = msgKeycipher.slice(0,48);
			if(!newLock) failedDecrypt('read-once');

			if(typeByte[0] == 164){														//PFS mode: last Key and new Lock
				var	sharedKey = makeShared(newLock,lastKey);

			}else if(typeByte[0] == 172){													//reset. lastKey is the permanent, or symmetric key
				var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
				if(!agree) return;
				var	sharedKey = makeShared(newLock,myKey);
				locDir[theirEmail][1] = locDir[theirEmail][2] = null;					//if reset type, delete ephemeral data first

			}else{																			//Read-once mode: last Key and last Lock
				var lastLockCipher = locDir[theirEmail][2];
				if (lastLockCipher != null) {												//if stored dummy Lock exists, decrypt it
					var lastLock = keyDecrypt(lastLockCipher,true)
				}else{																	//use new dummy if no stored dummy
					var lastLock = newLock
				}
				var	sharedKey = makeShared(lastLock,lastKey)
			}

			var msgKey = nacl.secretbox.open(msgKeycipher,nonce24,sharedKey);
			if(!msgKey) failedDecrypt('read-once');
			locDir[theirEmail][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
			locDir[theirEmail][3] = 'lock';

			syncChromeLock(theirEmail,JSON.stringify(locDir[theirEmail]))
		}
	}

	//final decryption for the main message, which is also compressed
	var plainstr = symDecrypt(cipher,nonce24,msgKey,true);
	plainstr = decryptSanitizer(plainstr);										//sanitize what is about to be put in the DOM, based on a whitelist

	readBox.textContent = '';	
	if(type != 'g'){
		readBox.innerHTML = plainstr;
	}else{																	//add further instructions if it was an invitation
		plainstr = "Congratulations! You have decrypted your first message from me with <b>PassLok for Email</b>. This is my message to you:<blockquote><em>" + plainstr + "</em></blockquote><br>Do this to reply to me with an encrypted message:<ol><li>Click the <b>Compose</b> or <b>Reply</b> button on your email program.</li><li>Type in my email address if it's not there already so PassLok can recognize the recipient, but <em>do not write your message yet</em>. Then click the <b>PassLok</b> logo (orange key in the bottom toolbar).</li><li>A new window will appear, and there you can write your reply securely.</li><li>After writing your message (and optionally selecting the encryption mode), click the <b>Encrypt to email</b> button.</li><li>The encrypted message will appear in the compose window. Add the subject and whatever plain text you want, and click <b>Send</b>.</li></ol>";
		readBox.innerHTML = plainstr
	}

	syncLocDir();															//everything OK, so store

	if(typeByte){
		if(typeByte[0] == 172){
			readMsg.textContent = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
		}else if(typeByte[0] == 160){
			readMsg.textContent = 'Decryption successful. This message cannot be decrypted again'
		}else if(typeByte[0] == 164){
			readMsg.textContent = 'Decryption successful. This message will become un-decryptable after you reply'
		}
	}else{
		readMsg.textContent = 'Decryption successful'
	}
	callKey = ''
}

//displays how many characters are left in decoy message
function charsLeftDecoy(){
	var chars = encodeURI(decoyText.value).replace(/%20/g, ' ').length;
	var limit = 75;
	if (chars <= limit){
		decoyMsg.textContent = chars + " characters out of " + limit + " used"
	}else{
		decoyMsg.textContent = 'Maximum length exceeded. The message will be truncated'
	}
}

//encrypts a hidden message into the padding included with list encryption, or makes a random padding also encrypted so it's indistinguishable
function decoyEncrypt(length,seckey){
	if(decoyMode.checked){
		if(typeof(decoyPwdIn) == "undefined"){
			showDecoyInDialog();
			return false		
		}
		if (!decoyPwdIn.value.trim() || !decoyText.value.trim()){ 					//stop to display the decoy entry form if there is no hidden message or key
			showDecoyInDialog();
			return false
		}
		var keyStr = decoyPwdIn.value,
			text = encodeURI(decoyText.value.replace(/%20/g, ' '));
			nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			keyStripped = stripHeaders(keyStr);

		if (keyStripped.length == 43 || keyStripped.length == 50){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase().replace(/l/g,'L'), base36, base64, true) //ezLock replaced by regular Lock
			var sharedKey = makeShared(convertPubStr(keyStripped),seckey);
		}else{
			var sharedKey = wiseHash(keyStr,nacl.util.encodeBase64(nonce));			//symmetric encryption for true shared key
		}
		
		while (text.length < length) text = text + ' ';				//add spaces to make the number of characters required
		text = text.slice(0,length);
		var cipher = concatUint8Arrays(nonce,symEncrypt(text,nonce24,sharedKey));
		
		decoyPwdIn.value = "";
		decoyText.value = "";
		$('#decoyIn').dialog("close");
		showDecoyInCheck.checked = false
	}else{
		var cipher = nacl.randomBytes(length + 25)					//no decoy mode so padding is random; add 25 to account for mac and nonce
	}
	return cipher
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,dummylock){
	if(typeof(decoyPwdOut) == "undefined"){
		showDecoyOutDialog();
		return false			
	}
	var decoyOut = document.getElementById('decoyPwdOut');
	if (!decoyOut.value.trim()){					//stop to display the decoy key entry form if there is no key entered
		showDecoyOutDialog();
		return false
	}
	var keyStr = decoyOut.value;
	decoyOut.value = ""	;

	var nonce = cipher.slice(0,9),
		cipherMsg = cipher.slice(9),
		nonce24 = makeNonce24(nonce),
		sharedKey = wiseHash(keyStr,nacl.util.encodeBase64(nonce)),				//try symmetric first
		plain = nacl.secretbox.open(cipherMsg,nonce24,sharedKey);
	if(!plain){																//not a shared key, so try asymmetric
		sharedKey = makeShared(dummylock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keyStr,myEmail)).secretKey));
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
	}
	
	$('#decoyOut').dialog("close");
	showDecoyOutCheck.checked = false;
	if(!plain) failedDecrypt('decoy');									//give up
	readMsg.innerHTML = 'Hidden message: <span style="color:blue">' + decryptSanitizer(decodeURI(nacl.util.encodeUTF8(plain))) + '</span>'
}

//does decoy decryption after a button is clicked
function doDecoyDecrypt(){
	if(padding){
		decoyDecrypt(padding,convertPubStr(theirLock));
		padding = ''
	}else{
		readMsg.textContent = 'You must have just decrypted something in order to use this feature'
	}
}
