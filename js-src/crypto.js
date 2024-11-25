//selects the encryption mode and starts it
function encrypt(){
	callKey = 'encrypt';
	if(stegoMode.checked){var lengthLimit = 10000}else{var lengthLimit = 71000};
	if(!chatMode.checked && composeBox.innerHTML.length > lengthLimit){
		var reply = confirm("This item is too long to be encrypted directly into the email and likely will be clipped by the server, rendering it undecryptable. We suggest to cancel and instead encrypt to file or to image, then attach the resulting file to your email");
		if(!reply) return
	}
	if(stegoMode.checked){
		var reply = enterCover();
		if(!reply) return
	}
	if(chatMode.checked){
		displayChat();
		return
	}else if(composeBox.innerHTML){		//sometimes imported text contains junk tags, so clean them out
		if(symMode.checked){															//if shared Pwd. mode, process is diverted ahead of key entry
			symmetricEncrypt(composeBox.textContent,false,false);
			return
		}
		for(var i = 0; i < emailList.length; i++) emailList[i] = emailList[i].trim();
		encryptList(emailList,false,false);
		isChatInvite = false;
		sharedPwd = ''
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

//selects the encryption mode and starts it, but outputs to file instead. Chat not an option
function encrypt2file(){
	callKey = 'encrypt2file';
	if(chatMode.checked){
		displayChat();
		return
	}else if(composeBox.innerHTML){
		if(symMode.checked){															//if shared Pwd. mode, process is diverted ahead of key entry
			symmetricEncrypt(composeBox.textContent,true,false);
			return
		}
		if(stegoMode.checked) enterCover();
		for(var i = 0; i < emailList.length; i++) emailList[i] = emailList[i].trim();
		encryptList(emailList,true,false);
		isChatInvite = false;
		sharedPwd = ''
	}else{
		composeMsg.textContent = 'Nothing to encrypt'
	}
}

//selects the encryption mode and starts it, but outputs to image instead. This function does prior encryption, to be followed by encoding
function encrypt2image(){
	callKey = 'encrypt2image';
	if(chatMode.checked){
		displayChat();
		return
	}else{
		if(symMode.checked){									//if shared Pwd. mode, process is diverted ahead of key entry
			symmetricEncrypt(composeBox.textContent,false,true);
			if(sharedPwd){
				stegoImageBox.value = sharedPwd;
				sharedPwd = ''
			}
			return
		}
		for(var i = 0; i < emailList.length; i++) emailList[i] = emailList[i].trim();
		encryptList(emailList,false,true);
		isChatInvite = false
	}
}

var text2decrypt = '';	

//function that starts it all when the read screen loads
function decrypt(){
	callKey = 'decrypt';
	var text = text2decrypt;
	text = text.replace(/<(.*?)>/gi,"");
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')) fromLetters(text);		//if hidden text
	if(text.match('\u00ad')) fromInvisible(text);
	decryptList();
	openChat()
}

//to concatenate a few Uint8Arrays fed as an array
function concatUi8(arrays) {
	var totalLength = 0;
	for(var i = 0; i < arrays.length; i++) totalLength += arrays[i].length;
	
	var result = new Uint8Array(totalLength);
  
	var length = 0;
	for(var i = 0; i < arrays.length; i++) {
	  result.set(arrays[i], length);
	  length += arrays[i].length;
	}
	return result
}

var inviteRequested = false;

//make an invitation. This only happens after the second button click
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
			inviteBtn.style.background = '#d9edff';
			composeMsg.textContent = 'Invite button disarmed';
			callKey = '';
		}, 10000)								//forget request after 10 seconds

	}else{
		callKey = 'inviteEncrypt';
		if(!refreshKey()) return;			//check that key is active and stop if not
		var nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
			text = composeBox.innerHTML.trim();

		setTimeout(function(){composeMsg.textContent = "This invitation can be decrypted by anyone"},20);

		var output = myezLock + '//////' + nacl.util.encodeBase64(concatUi8([[128],nonce,symEncrypt(text,nonce24,myLockbin,true)])).replace(/=+$/,'')
		output = output.match(/.{1,80}/g).join("\r\n");
		var outNode = document.createElement('div');	
		outNode.style.whiteSpace = "pre-line";			//so the line feeds format correctly
		outNode.textContent = "The gibberish link below contains a message from me that has been encrypted with PassLok for Email, To decrypt it, do this:\r\n\r\n1. Install the PassLok for Email extension by following one of these links:\r\nChrome: https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh\r\nFirefox: https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email/\r\n\r\n2. Reload your email and get back to this message.\r\n\r\n3. Click the PassLok logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.\r\n\r\nIf your email is not on Gmail, Yahoo, or Outlook, you may want to install PassLok Universal instead, also available at the Chrome and Firefox stores.\r\n\r\nIf you don't use Chrome or Firefox, or don't want to install an extension, you can also open the message in PassLok Privacy, a standalone app available from https://passlok.com/app\r\n";
		var initialTag = document.createElement('pre'),
			invBody = document.createElement('pre'),
			finalTag = document.createElement('pre');
		initialTag.textContent = "----------begin invitation message encrypted with PassLok--------==";
		invBody.textContent = output;
		finalTag.textContent = "==---------end invitation message encrypted with PassLok-----------";
		outNode.appendChild(initialTag);
		outNode.appendChild(invBody);
		outNode.appendChild(finalTag);

		if(typeof(isNewYahoo) == "undefined") outNode.contentEditable = 'true';

		insertInBody(outNode);
		inviteRequested = false;
		callKey = '';
		window.close()
	}
}

//encrypts for a list of recipients, as emails in listArray. First makes a 256-bit message key, then gets the Lock for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's Lock, so he/she can find the right encrypted key
//two modes: Signed, and ReadOnce
function encryptList(listArray,isFileOut,isImageOut){
	if(!refreshKey()) return;			//check that key is active and stop if not
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
	}else{
		composeMsg.textContent = 'Welcome to PassLok'
	}
	if(!onceMode.checked) encryptArray.push(myEmail);				//copy to myself unless read-once
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
		text = composeBox.innerHTML;
	if(anonMode.checked){
		var outString = '',									//no Lock included in anonymous mode
			secdum = nacl.randomBytes(32),					//make dummy Key and Lock
			pubdum = makePub(secdum)
	}else{
		var outString = myezLock + '//////'
	}

	var outArray = new Uint8Array(2);	
	if(onceMode.checked){
		outArray[0] = 56												//will become "O" in base64
	}else if(anonMode.checked){
		outArray[0] = 0;												//will become "A" in base64
	}else{
		outArray[0] = 72;												//will become "S" in base64
	}
	outArray[1] = recipients;

	if(anonMode.checked){
		var paddingIn = decoyEncrypt(75,secdum)						//this for decoy mode
	}else{
		var paddingIn = decoyEncrypt(75,myKey)
	}
	if(!paddingIn) return;

	var cipher = symEncrypt(text,nonce24,msgKey,true);					//main encryption event including compression, but don't add the result yet
		
	outArray = concatUi8([outArray,nonce,paddingIn]);
	
	if(anonMode.checked) outArray = concatUi8([outArray,pubdum]);					//for anonymous mode, add the dummy Lock now

	//for each email on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext obtained when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (index = 0; index < encryptArray.length; index++){
		email = encryptArray[index];
		if (email != ''){
			if(email == myEmail){
				var Lock = myLock										//string version of myLockbin
			}else{
				var Lock = locDir[email][0]
			}
			if(anonMode.checked){															//for Anonymous mode
				var sharedKey = makeShared(convertPubStr(Lock),secdum),
					cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
					LockBin2 = nacl.util.decodeBase64(Lock);
				if(!LockBin2) return false;
				var	idTag = nacl.secretbox(LockBin2,nonce24,sharedKey).slice(0,8)

			}else if(!onceMode.checked){													//for Signed mode and Chat invites
				var sharedKey = makeShared(convertPubStr(Lock),myKey),
					cipher2 = nacl.secretbox(msgKey,nonce24,sharedKey),
					LockBin2 = nacl.util.decodeBase64(Lock);
				if(!LockBin2) return false;
				var	idTag = nacl.secretbox(LockBin2,nonce24,sharedKey).slice(0,8)
					
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
						LockBin2 = nacl.util.decodeBase64(Lock);
					if(!LockBin2) return false;
					var	idTag = nacl.secretbox(LockBin2,nonce24,idKey).slice(0,8);

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
				if(email != myEmail) outArray = concatUi8([outArray,idTag,cipher2,typeByte,newLockCipher])
			}else{
				outArray = concatUi8([outArray,idTag,cipher2])
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString += nacl.util.encodeBase64(concatUi8([outArray,cipher])).replace(/=+$/,'');
	finishEncrypt(outString,isFileOut,isImageOut,inviteArray,encryptArray.length)			//see if invitations would have been needed
}

//output formatting, which is shared by symmetric encryption modes
function finishEncrypt(outString,isFileOut,isImageOut,inviteArray,recipientNumber){
	var outNode = document.createElement('div');	
	outNode.style.whiteSpace = "pre-line";									//so that carriage returns are respected
	outNode.id = "composeOut";
	var invitesNeeded = !symMode.checked && (inviteArray.length != 0);
	
if(!isImageOut){																//normal output, not to image
	if(stegoMode.checked){
		outString = textStego(outString)
	}else if(invisibleMode.checked){
		outString = invisibleStego(outString)
	}

	if(isFileOut && !invisibleMode.checked){									//output to File
		var fileLink = document.createElement('a');
		if(stegoMode.checked){
			fileLink.download = "ChangeMe.txt";
			fileLink.href = "data:," + outString;
			fileLink.textContent = "PassLok Hidden message. Make sure to change the name"			
		}else if(onceMode.checked){
			if(textMode.checked){
				fileLink.download = "PL24mso.txt";
				fileLink.href = "data:," + outString;
				fileLink.textContent = "PassLok 2.4 Read-once message (text file)"
			}else{
				fileLink.download = "PL24mso.plk";
				fileLink.href = "data:binary/octet-stream;base64," + outString;
				fileLink.textContent = "PassLok 2.4 Read-once message (binary file)"
			}
		}else if(symMode.checked){
			if(textMode.checked){
				fileLink.download = "PL24msp.txt";
				fileLink.href = "data:," + outString;
				fileLink.textContent = "PassLok 2.4 shared Password message (text file)"
			}else{
				fileLink.download = "PL24msp.plk";
				fileLink.href = "data:binary/octet-stream;base64," + outString;
				fileLink.textContent = "PassLok 2.4 shared Password message (binary file)"
			}
		}else if(anonMode.checked){
			if(textMode.checked){
				fileLink.download = "PL24msa.txt";
				fileLink.href = "data:," + outString;
				fileLink.textContent = "PassLok 2.4 Anonymous message (text file)"
			}else{
				fileLink.download = "PL24msa.plk";
				fileLink.href = "data:binary/octet-stream;base64," + outString;
				fileLink.textContent = "PassLok 2.4 Anonymous message (binary file)"
			}
		}else{
			if(textMode.checked){
				fileLink.download = "PL24mss.txt";
				fileLink.href = "data:," + outString;
				fileLink.textContent = "PassLok 2.4 Signed message (text file)"
			}else{
				fileLink.download = "PL24mss.plk";
				fileLink.href = "data:binary/octet-stream;base64," + outString;
				fileLink.textContent = "PassLok 2.4 Signed message (binary file)"
			}
		}
	}else{																		//output to email page
		if(stegoMode.checked){
			outNode.textContent = outString
		}else if(invisibleMode.checked){
			outNode.textContent = 'Invisible message at the end of the introduction below this line. Edit as needed and remove this notice:\r\n\r\nDear friend,' + outString + '\r\n\r\nBody of the message.'
		}else{
			var fileLink = document.createElement('pre');
			if(onceMode.checked){			
				fileLink.textContent = '----------begin Read-once message encrypted with PassLok--------==\r\n\r\n' + outString.match(/.{1,80}/g).join("\r\n") + '\r\n\r\n==---------end Read-once message encrypted with PassLok-----------'
			}else if(isChatInvite){
				fileLink.textContent = '----------begin Chat invitation encrypted with PassLok--------==\r\n\r\n' + outString.match(/.{1,80}/g).join("\r\n") + '\r\n\r\n==---------end Chat invitation encrypted with PassLok-----------'
			}else if(symMode.checked){			
				fileLink.textContent = '----------begin shared Password message encrypted with PassLok--------==\r\n\r\n' + outString.match(/.{1,80}/g).join("\r\n") + '\r\n\r\n==---------end shared Password message encrypted with PassLok-----------'
			}else if(anonMode.checked){
				fileLink.textContent = '----------begin Anonymous message encrypted with PassLok--------==\r\n\r\n' + outString.match(/.{1,80}/g).join("\r\n") + '\r\n\r\n==---------end Anonymous message encrypted with PassLok-----------'
			}else{
				fileLink.textContent = '----------begin Signed message encrypted with PassLok--------==\r\n\r\n' + outString.match(/.{1,80}/g).join("\r\n") + '\r\n\r\n==---------end Signed message encrypted with PassLok-----------'
			}
		}
	}
	if(fileLink) outNode.appendChild(fileLink)
}else{																			//no extra text if output is to image
	outNode.textContent = outString
}
	outNode.contentEditable = 'true';
	syncLocDir();
	visibleMode.checked = true;
	decoyMode.checked = false;
	if(isFileOut){
		composeMsg.textContent = "Contents encrypted into a file. Now save it, close this dialog, and attach the file to your email";
		composeBox.textContent = '';
		composeBox.appendChild(outNode)

	}else if(isImageOut){
		composeBox.textContent = '';
		composeBox.appendChild(outNode);
		openScreen('stegoImageScr');
		encodePNGBtn.style.display = '';
		encodeJPGBtn.style.display = '';
		decodeImgBtn.style.display = 'none';
		if((onceMode.checked && recipientNumber == 1) || (!onceMode.checked && recipientNumber < 3)){
			stegoImageMsg.textContent = 'Message encrypted. Now choose an image to hide it into and click either Encrypt to PNG, or Encrypt to JPG. This pre-filled image Password will also be pre-filled on the receiving end.'
		}else{
			stegoImageMsg.textContent = 'Message encrypted. Now choose an image to hide it into and click either Encrypt to PNG, or Encrypt to JPG. For best results, use a Password known to the recipient.'
		}
	}else{
		insertInBody(outNode)
	}
	callKey = '';
	if(invitesNeeded){
		composeMsg.textContent = 'These recipients will not be able to decrypt your message because they are not yet in your directory:\n' + inviteArray.join(', ') + '\nYou should send them an invitation first. You may close this dialog now';
		composeBox.textContent = '';
		openScreen('composeScr')
	}else if(!isFileOut && !isImageOut){
		 	setTimeout(function(){window.close()},200)		//close after a delay, to make sure the command arrives
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
	return nacl.util.encodeBase64(concatUi8([[144],nonce,cipher])).replace(/=+$/,'')		//1st character should be k
}

//decrypts a string encrypted with the secret Key, 12 char nonce. Returns original if not encrypted. If isArray set, return uint8 array
function keyDecrypt(cipherStr,isArray){
	var cipher = nacl.util.decodeBase64(cipherStr);
	if(!cipher) return false;
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
						failedDecrypt('old'); return
					}
				}else{
					failedDecrypt('new'); return							//this will open the old Password dialog
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
function stripHeaders(string,leaveSpaces){
	string = string.replace(/\n/g,'').replace(/&nbsp;/g,'');								//remove special spaces, newlines
	if(string.match('==')) string = string.split('==')[1];								//keep only PassLok item, if bracketed
	string = string.replace(/<(.*?)>/gi,"").replace(/[^a-zA-Z0-9\+\/\s]/g,''); 		//takes out html tags and anything that is not base64 or a space
	return leaveSpaces ? string : string.replace(/\s/g,'')								//unless leaveSpaces is on, remove spaces as well
}

//to make sure attached Lock is correct
function isBase36(string){
	var result = true;
	for(var i = 0; i < string.length; i++){
		result = result && (base36.indexOf(string.charAt(i)) >= 0)
	}
	return result
}

var padding = '';			//global variable involved in decoding secret message, needed for decoy decrypt

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Read-once, or an Invitation. This is detected automatically. It can also be an encrypted database
function decryptList(){
	readBox.textContent = '';
	var hasTags = !!text2decrypt.match('=='),
		text = stripHeaders(text2decrypt),										//get the data from a global variable holding it
		words = stripHeaders(text2decrypt,true).trim(),						    //this just in case it's a word Lock; spaces are left in
		hasLock,onlyLock;

	if(isBase36(text.slice(0,50)) && (text.slice(50,56) == '//////')){			//find Lock located at the start
		theirLock = changeBase(text.slice(0,50),base36,base64,true);
		hasLock = true;
		onlyLock = false
	
	}else if(text.length == 50 && isBase36(text)){								//just an ezLock
		theirLock = changeBase(text,base36,base64,true);
		hasLock = true;
		onlyLock = true
		
	}else if(text.length == 43){													//just a regular Lock
		theirLock = text;
		hasLock = true;
		onlyLock = true
		
	}else if(words.split(' ').length == 20){										//word Lock
		var theirLockTest = changeBase(words,wordListExp,base64,true);			  		//convert to base64
		if(theirLockTest){
			theirLock = theirLockTest;
			hasLock = true;
			onlyLock = true
		}
		
	}else if(text.charAt(0) == 'k'){													//it's an encrypted database, so decrypt it and merge it
		var agree = confirm('This is an encrypted local database. It will be loaded if you click OK, possibly replacing current data. This cannot be undone.');
		if(!agree){
			readBox.textContent = '';
			readMsg.textContent = 'Backup merge canceled';
			openReadScreen();
			return
		}
		var newData = JSON.parse(keyDecrypt(text,false));
		locDir = mergeObjects(locDir,newData);
		syncLocDir();
		readMsg.textContent = 'Data from backup merged';
		openReadScreen();
		return
		
	}else{
		hasLock = false
	}
	
	if(hasLock){
		if(!locDir[theirEmail] && hasLock){											//make entry if needed
			locDir[theirEmail] = [];
			locDir[theirEmail][0] = theirLock;
			storeData(theirEmail)
		}else if(locDir[theirEmail][0] != theirLock && hasLock){					//to get permission to change it
			openNewLock();
			return
		}
		text = text.slice(56);												//take out ezLock and separator
	}
	
	if(!text || onlyLock){
		if(hasLock){
			readMsg.textContent = "This message contains only the sender's Lock. Nothing to decrypt"
		}else{
			readMsg.textContent = "Nothing to decrypt"
		}
		openReadScreen();
		return
	}
	
	var	type = text.charAt(0);
	
	if(!hasLock && type != 'A'){							//no Lock and not asymmetric encryption, so probably symmetric
		if(type == 'g' || hasTags){
			symmetricDecrypt(text)
		}else{												//no tags so likely just text
			readMsg.textContent = "This message is not encrypted, but perhaps the images or attachments are. Download them and click the arrow to decrypt them";
			openReadScreen()
		}
		return
	}
	
	if(!refreshKey()) return;											//make sure the key is loaded, otherwise stop to get it

	var cipherInput = nacl.util.decodeBase64(text);
	if(!cipherInput) return false;
	var	recipients = cipherInput[1],										//number of recipients. '0' reserved for special cases
		stuffForId = myLockbin;
	if(type == 'g'){
		var nonce = cipherInput.slice(1,10),						//shorter nonce for invitations, no padding
			cipher = cipherInput.slice(10);
		padding = []												//this is global
	}else if(type == 'A'){
		var nonce = cipherInput.slice(2,17);									//15 bytes
		padding = cipherInput.slice(17,117);								//100 bytes, global
		var pubdum = cipherInput.slice(117,149);							//retrieve ephemeral lock for Anonymous mode
		cipherInput = cipherInput.slice(149)
	}else if(type == 'S' || type == 'O'){
		var nonce = cipherInput.slice(2,17);									//15 bytes
		padding = cipherInput.slice(17,117);								//100 bytes, global
		cipherInput = cipherInput.slice(117)
	}else{
		readMsg.textContent = "This message is not encrypted, but perhaps the images or attachments are. Download them and click the arrow to decrypt them";
		openReadScreen();
		return
	}

	var nonce24 = makeNonce24(nonce);	
	
	//now cut the rest of the input into pieces. First ID tags and their respective encrypted keys etc., then the ciphertext
	var cipherArray = new Array(recipients);
	if(type == 'O'){																//longer pieces in Read-once mode
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(105*i,105*(i+1))		//8 bytes for ID, 48 for encrypted ephemeral Lock, 48 for encrypted key, 1 for type
		}
		var cipher = cipherInput.slice(105*recipients)
	}else if(type != 'g'){															//shorter pieces in Anonymous and Signed modes
		for(var i = 0; i < recipients; i++){
			cipherArray[i] = cipherInput.slice(56*i,56*(i+1))		//8 bytes for ID, 48 for encrypted key
		}
		var cipher = cipherInput.slice(56*recipients)
	
	}

	if (type == 'O' && theirEmail == myEmail){
		readMsg.textContent = 'You cannot decrypt Read-once messages to yourself';
		openReadScreen();
		return
	}
	if(type == 'S'){														//Signed mode
		var sharedKey = makeShared(convertPubStr(theirLock),myKey),
			idKey = sharedKey
	
	}else if(type == 'A'){													//Anonymous mode
		var	sharedKey = makeShared(pubdum,myKey),
			idKey = sharedKey

	}else if(type == 'O'){													//Read-once mode
		if (locDir[theirEmail]){
			var	lastKeyCipher = locDir[theirEmail][1],
				lastLockCipher = locDir[theirEmail][2],
				turnstring = locDir[theirEmail][3]									//this strings says whose turn it is to encrypt
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = keyDecrypt(lastKeyCipher,true),
				idKey = makeShared(convertPubStr(theirLock),lastKey)
		}else{																//if a dummy Key doesn't exist, use permanent Key
			var lastKey = myKey,
				idKey = makeShared(convertPubStr(theirLock),myKey)
		}
	}
	
	if(type == 'g'){														//key for Invitation is the sender's Lock, otherwise, got to find it
		var msgKey = nacl.util.decodeBase64(theirLock);
		if(!msgKey) return false;
		
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
			if(theirLock || pubdum){
				if(myKey) lastKey = myKey;
				if(type == 'A'){
					idKey = makeShared(pubdum,myKey)
				}else{
					idKey = makeShared(convertPubStr(theirLock),myKey)
				}
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
			if(typeof(msgKeycipher) == 'undefined'){					//the password may have changed, so try again with old password
				if(oldPwdStr){
					var oldKeySgn = nacl.sign.keyPair.fromSeed(wiseHash(oldPwdStr,myEmail)).secretKey,
						oldKey = ed2curve.convertSecretKey(oldKeySgn),
						oldLockbin = nacl.sign.keyPair.fromSecretKey(oldKeySgn).publicKey,
						oldLock = nacl.util.encodeBase64(oldLockbin).replace(/=+$/,'');
						
				}else{													//prompt for old password
					openScreen('oldPwdScr');
					return
				}
				
				if(type == 'S'){
					idKey = makeShared(convertPubStr(theirLock),oldKey)
				}else if(type == 'A'){
					idKey = makeShared(pubdum,oldKey)
				}else{
					if(lastKeyCipher){	
						lastKey = keyDecrypt(lastKeyCipher,true);
						idKey = makeShared(convertPubStr(theirLock),lastKey)
					}else{
						lastKey = myKey;
						idKey = makeShared(convertPubStr(theirLock),lastKey)
					}
				}
				idTag = nacl.secretbox(oldLockbin,nonce24,idKey).slice(0,8);

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
					if(type == 'O'){
						failedDecrypt('idReadonce'); openReadScreen(); return
					}else{
						failedDecrypt('idSigned'); openReadScreen(); return
					}
				}
			}
		}

		//got the encrypted message key so now decrypt it, and finally the main message. The process for Read-once mode is more involved.
		if (type != 'O'){					//Anonymous and Signed modes
			var msgKey = nacl.secretbox.open(msgKeycipher,nonce24,sharedKey);
			if(!msgKey) {failedDecrypt('signed'); openReadScreen(); return};

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last byte
		}else{
			var	typeByte = msgKeycipher.slice(48,49),
				newLockCipher = msgKeycipher.slice(49),
				newLock = nacl.secretbox.open(newLockCipher,nonce24,idKey);
			msgKeycipher = msgKeycipher.slice(0,48);
			if(!newLock) {failedDecrypt('read-once'); openReadScreen(); return};

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
			if(!msgKey) {failedDecrypt('read-once'); openReadScreen(); return};
			locDir[theirEmail][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
			locDir[theirEmail][3] = 'lock';

			syncChromeLock(theirEmail,JSON.stringify(locDir[theirEmail]))
		}
	}

	//final decryption for the main message, which is also compressed
	var plainstr = symDecrypt(cipher,nonce24,msgKey,true).replace(/style="(.*?)"/g,'');	//remove styles that might have crept in; this function has its own error handling
	if(!plainstr){failedDecrypt(''); openReadScreen(); return}
	plainstr = decryptSanitizer(plainstr);													//sanitize what is about to be put in the DOM, based on a whitelist

	if(type == 'g'){																	//add further instructions if it was an invitation
		plainstr = "Congratulations! You have decrypted your first message from me with <b>PassLok for Email</b>. This is my message to you:<blockquote><em>" + plainstr + "</em></blockquote><br>Do this to reply to me with an encrypted message:<ol><li>Click the <b>Compose</b> or <b>Reply</b> button on your email program.</li><li>Type in my email address if it's not there already so PassLok can recognize the recipient, but <em>do not write your message yet</em>. Then click the <b>PassLok</b> logo (orange key in the bottom toolbar).</li><li>A new window will appear, and there you can write your reply securely.</li><li>After writing your message (and optionally selecting the encryption mode), click the <b>Encrypt to email</b> button.</li><li>The encrypted message will appear in the compose window. Add the subject and whatever plain text you want, and click <b>Send</b>.</li></ol>";		
	}
	readBox.innerHTML = plainstr;

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
		if(type == 'A'){
			readMsg.textContent = 'Decryption successful, but the sender is not authenticated'
		}else{
			readMsg.textContent = 'Decryption successful'
		}
	}
	openReadScreen();
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
		if (!decoyInBox.value.trim() || !decoyText.value.trim()){ 					//stop to display the decoy entry form if there is no hidden message or key
			openScreen('decoyInScr');
			return false
		}
		var decoyKeyStr = decoyInBox.value.trim(),
			text = encodeURI(decoyText.value.trim().replace(/%20/g, ' '));
			nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			keyStripped = stripHeaders(decoyKeyStr);

		if (keyStripped.length == 43 || keyStripped.length == 50){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase().replace(/l/g,'L'), base36, base64, true) //ezLock replaced by regular Lock
			var sharedKey = makeShared(convertPubStr(keyStripped),seckey);
		}else{
			var sharedKey = wiseHash(decoyKeyStr,nacl.util.encodeBase64(nonce));			//symmetric encryption for true shared key
		}
		
		while (text.length < length) text = text + ' ';				//add spaces to make the number of characters required
		text = text.slice(0,length);
		var cipher = concatUi8([nonce,symEncrypt(text,nonce24,sharedKey)]);
		
		decoyInBox.value = '';
		decoyText.value = '';
		showDecoyIn.checked = false;
		openReadScreen()

	}else{
		var cipher = nacl.randomBytes(length + 25)					//no decoy mode so padding is random; add 25 to account for mac and nonce
	}
	return cipher
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,dummylock){
	var decoyKeyStr = decoyOutBox.value.trim();		//turn into local variable
	decoyOutBox.value = '';

	var nonce = cipher.slice(0,9),
		cipherMsg = cipher.slice(9),
		nonce24 = makeNonce24(nonce),
		sharedKey = wiseHash(decoyKeyStr,nacl.util.encodeBase64(nonce)),				//try symmetric first
		plain = nacl.secretbox.open(cipherMsg,nonce24,sharedKey)

	if(!plain){																//not a shared key, so try asymmetric
		sharedKey = makeShared(dummylock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(decoyKeyStr,myEmail)).secretKey));
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
	}
	
	if(plain){
		return 'Hidden message: ' + decodeURI(nacl.util.encodeUTF8(plain))
	}else{
		return "No Hidden message found"
	}
}

//does decoy decryption after a button is clicked
function doDecoyDecrypt(){
	if(padding){
		if(!decoyOutBox.value.trim()){					//stop to display the decoy key entry form if there is no key entered
			openScreen('decoyOutScr');
			return
		}
		openScreen('readScr');
		var decoyMsg = decoyDecrypt(padding,convertPubStr(theirLock));
		if(decoyMsg){
			readMsg.textContent = decoyMsg
		}else{
			readMsg.textContent = 'No Hidden message found'
		}
		padding = ''
	}else{
		readMsg.textContent = 'You must have just decrypted an eligible message in order to use this feature'
	}
}
