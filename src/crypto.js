//function that starts it all when the Unlock button is pushed
function decrypt(){
	if(!myKey) showKeyDialog();
	callKey = 'decrypt';
	readMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		decryptList();
		openChat();
	},20);						//end of timeout
};

//same but for locking
function signedEncrypt(){
	if(!myKey) showKeyDialog();
	callKey = 'signedEncrypt';
	composeMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';			//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		var emailArray = composeRecipientsBox.innerText.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,false);
		isChatInvite = false;
	},20);						//end of timeout
};

function readOnceEncrypt(){
	if(!myKey) showKeyDialog();
	callKey = 'readOnceEncrypt';
	composeMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																			//the rest after a 20 ms delay
		var emailArray = composeRecipientsBox.innerText.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,true);
	},20);						//end of timeout
};

var inviteRequested = false;
//make an invitation. This only happens after the second button click
function inviteEncrypt(){
	callKey = 'inviteEncrypt';
	if(!myKey) showKeyDialog();
	if(!inviteRequested){				//sets flag so action happens on next click
		inviteRequested = true;
		composeMsg.innerHTML = "If you click <strong>Invite</strong> again, the contents of the box will be encrypted and added to a special invitation message. This message can be decrypted by anyone and is <span class='blink'>NOT SECURE</span>";
		inviteBtn.style.background = '#FB5216';
		inviteBtn.style.color = 'white';
		setTimeout(function() {
			inviteRequested = false;
			inviteBtn.style.background = '';
			inviteBtn.style.color = '';
			callKey = '';
		}, 10000)								//forget request after 10 seconds

	}else{
		readKey();
		var nonce = nacl.randomBytes(15),
			nonce24 = makeNonce24(nonce),
			noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
			text = composeBox.innerHTML;
		if(!text.toLowerCase().match('data:;')) text = LZString.compressToBase64(text);
  		var cipherstr = symEncrypt(text,nonce24,myLockbin);
		setTimeout(function(){composeMsg.innerHTML = "This invitation can be decrypted by anyone"},20);
		composeBox.innerHTML = myezLock + "@" + noncestr + "%" + cipherstr;
		composeBox.innerHTML = composeBox.innerHTML.match(/.{1,70}/g).join("<br>");
		composeBox.innerHTML = "<br>The gibberish below contains a message from me that has been encrypted with <b>PassLok for Email</b>. To decrypt it, do this:<ol><li>Install the PassLok for Email Chrome extension by following this link: https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh</li><li>Reload your email and get back to this message.</li><li>Click the <b>PassLok</b> logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.</li><li>When asked whether to accept my new Password (which you don't know), go ahead and click <b>OK</b>.</li></ol><br><pre>----------begin invitation message encrypted with PassLok--------==<br><br>" + composeBox.innerHTML + "<br><br>==---------end invitation message encrypted with PassLok-----------</pre>";
	
		document.getElementById(bodyID).innerHTML = composeBox.innerHTML;
		$('#composeScr').dialog("close");
		inviteRequested = false;
		callKey = '';
	}
}

//encrypts for a list of recipients, as emails in listArray. First makes a 256-bit message key, then gets the Lock for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's Lock, so he/she can find the right encrypted key
//two modes: Signed, and ReadOnce
function encryptList(listArray,isReadOnce){
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
		composeMsg.innerHTML = 'None of these recipients are in your directory. You should send them an invitation first.';
		return
	}
	if(!isReadOnce) encryptArray.push(myEmail);						//copy to myself unless read-once
	encryptArray = shuffle(encryptArray);							//extra precaution

	readKey();
	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = composeBox.innerHTML;

	if(!text.toLowerCase().match('data:;')) text = LZString.compressToBase64(text);
	var cipher = symEncrypt(text,nonce24,msgKey);					//main encryption event, but don't add it yet

	if(isReadOnce){													//add type marker and nonce
		var outString = myezLock + '$' + noncestr
	}else{
		var outString = myezLock + '#' + noncestr
	}

	//for each email on the List (unless empty), encrypt the message key and add it, prefaced by the first 256 bits of the ciphertext when the item is encrypted with the message nonce and the shared key. Notice: same nonce, but different key for each item (unless someone planted two recipients who have the same key, but then the encrypted result will also be identical).
	for (index = 0; index < encryptArray.length; index++){
		email = encryptArray[index];
		if (email != ''){
			if(email == myEmail){
				var Lock = myLock
			}else{
				var Lock = locDir[email][0]
			}
			if(!isReadOnce){
				var sharedKey = makeShared(convertPubStr(Lock),myKey),
					cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
					idTag = symEncrypt(Lock,nonce24,sharedKey);
			}else{
				var	turnstring = locDir[email][3];

				if(email != myEmail){								//can't do Read-once to myself
					var lastLockCipher = locDir[email][2];					//retrieve dummy Lock from storage, [0] is the permanent Lock by that email
					if (lastLockCipher) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher);
					} else {													//use permanent Lock if dummy doesn't exist
						var lastLock = convertPubStr(Lock);
						var firstMessage = true;						//to warn user
					}
					var idKey = makeShared(lastLock,myKey);
					var secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						pubdumstr = makePubStr(secdum);

					if (turnstring!='lock'){								//out of sequence, use PFS mode
						if(turnstring == 'reset'){
							var typeChar = 'r';
							var resetMessage = true
						}else{
							var typeChar = 'p';
							var pfsMessage = true
						};
						var sharedKey = makeShared(lastLock,secdum);		//in PFS, use new dummy Key and stored Lock

					}else{													//in sequence, proper Read-once mode
						var typeChar = 'o';
						var lastKeyCipher = locDir[email][1];						//Read-once mode uses previous Key and previous Lock
						if (lastKeyCipher){
							var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
						} else {													//use new dummy Key if stored dummy Key doesn't exist
							var lastKey = secdum;
							typeChar = 'p';
							var pfsMessage = true
						}
						var sharedKey = makeShared(lastLock,lastKey);
					}

					locDir[email][1] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
					if(turnstring != 'reset') locDir[email][3] = 'unlock';

					syncChromeLock(email,JSON.stringify(locDir[email]));

					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = symEncrypt(Lock,nonce24,idKey),
						newLockCipher = symEncrypt(pubdumstr,nonce24,idKey);

				}else{
					if(encryptArray.length < 2){
						composeMsg.innerHTML = 'In Read-once mode, you must select recipients other than yourself.';
						throw('only myself for Read-once')
					}
				}
			}
			if(isReadOnce){
				if(email != myEmail) outString = outString + '%' + idTag.slice(0,9) + '%' + newLockCipher + cipher2 + typeChar;
			}else{
				outString = outString + '%' + idTag.slice(0,9) + '%' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString = outString + '%' + cipher;
	if(isReadOnce){
		composeBox.innerHTML = '<pre>----------begin Read-once message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Read-once message encrypted with PassLok-----------</pre>'
	} else if(isChatInvite){
		composeBox.innerHTML = '<pre>----------begin Chat invitation encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Chat invitation encrypted with PassLok-----------</pre>'
	} else {
		composeBox.innerHTML = '<pre>----------begin Signed message encrypted with PassLok--------==<br><br>' + outString.match(/.{1,70}/g).join("<br>") + '<br><br>==---------end Signed message encrypted with PassLok-----------</pre>'
	}

	syncLocDir();
	callKey = '';
	document.getElementById(bodyID).innerHTML = composeBox.innerHTML;
	
	if(inviteArray.length != 0){		 
		composeMsg.innerHTML = 'The following recipients have been removed from your encrypted message because they are not yet in your directory:<br>' + inviteArray.join(', ') + '<br>You should send them an invitation first. You may close this dialog now'
	}else{
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
        a[j] = x;
    }
	return a
}

//encrypts a string with the secret Key, 12 char nonce
function keyEncrypt(plainstr){
	plainstr = encodeURI(plainstr).replace(/%20/g,' ');			//in case there are any special characters
	readKey();
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce),
		cipherstr = symEncrypt(plainstr,nonce24,myKey).replace(/=+$/,'');
	return '~' + noncestr + cipherstr
}

//decrypts a string encrypted with the secret Key, 12 char nonce. Returns original if not encrypted
function keyDecrypt(cipherstr){
	if (cipherstr.charAt(0) == '~'){
		readKey();
		cipherstr = cipherstr.slice(1);							//take out the initial '~'
		var	noncestr = cipherstr.slice(0,12),
			nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
		cipherstr = cipherstr.slice(12);
		return decodeURI(symDecrypt(cipherstr,nonce24,myKey).trim())
	}else{
		return cipherstr
	}
}

//this strips initial and final header, plus spaces and non-base64 characters in the middle
function stripHeaders(string){
	string = string.replace(/[\s\n]/g,'').replace(/<(.*?)>/gi, "");								//remove spaces, newlines, and any html tags
	string = string.trim().split("==")[1]
	string = string.replace(/[^a-zA-Z0-9+\/@#\$%]+/g,''); 										//takes out anything that is not base64 or a type marker
	return string
}

//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Read-once, or an Invitation. This is detected automatically.
function decryptList(){
	var text = stripHeaders(readBox.innerHTML);
	theirEmail = senderBox.innerHTML.trim();
	theirLock = changeBase(text.slice(0,50),BASE36,BASE64,true);
	
	if(!locDir[theirEmail]){											//make entry if needed
		locDir[theirEmail] = [];
		var isNewLock = true;
			changedLock = true;
	}else if(locDir[theirEmail][0] != theirLock){					//to get permission to change it
		var changedLock = true
	}else{
		var changedLock = false
	}
	if(changedLock) openNewLock();
	
	text = text.slice(50);
	
	if(theirLock && !text){
		readMsg.innerHTML = "This message contains only the sender's Lock. Nothing to decrypt";
		throw("empty message")
	}
	
	var	type = text.charAt(0);
	text = text.slice(1);
	var cipherArray = text.split('%');
	readKey();
	var stuffForId = myLock;

	var noncestr = cipherArray[0].slice(0,20);
	var	nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
	var cipher = cipherArray[cipherArray.length - 1];

	if(type == '#'){														//signed mode
		var sharedKey = makeShared(convertPubStr(theirLock),myKey),
			idKey = sharedKey;

	}else if(type == '$'){													//Read-once mode
		if (locDir[theirEmail]){
			var	lastKeyCipher = locDir[theirEmail][1],
				lastLockCipher = locDir[theirEmail][2],
				turnstring = locDir[theirEmail][3];									//this strings says whose turn it is to encrypt
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
			var idKey = makeShared(convertPubStr(theirLock),lastKey);
		}else{														//if a dummy Key doesn't exist, use permanent Key
			var lastKey = myKey;
			var idKey = makeShared(convertPubStr(theirLock),myKey);
		}
	}
	
if(type == '@'){														//key for Invitation is the sender's Lock, otherwise, got to find it
	var msgKey = nacl.util.decodeBase64(theirLock)
}else{
	var idTag = symEncrypt(stuffForId,nonce24,idKey).slice(0,9);

	//look for the id tag and return the string that follows it
	for (i = 1; i < cipherArray.length; i++){
		if (idTag == cipherArray[i]) {
			var msgKeycipher = cipherArray[i+1];
		}
	}

	if(typeof msgKeycipher == 'undefined'){							//may have been reset, so try again
		if(theirLock){
			lastKey = myKey;
			idKey = makeShared(convertPubStr(theirLock),myKey);
			idTag = symEncrypt(stuffForId,nonce24,idKey).slice(0,9);
			for (i = 1; i < cipherArray.length; i++){
				if (idTag == cipherArray[i]) {
					var msgKeycipher = cipherArray[i+1];
				}
			}
		}
		if(typeof msgKeycipher == 'undefined'){						//the password may have changed, so try again with old password
			if(!document.getElementById('oldPwd')){showOldKeyDialog(); throw('stopped for Old Password');}
				if(oldPwdStr){
					var oldKeySgn = nacl.sign.keyPair.fromSeed(wiseHash(oldPwdStr,myEmail)).secretKey,
						oldKey = ed2curve.convertSecretKey(oldKeySgn),
						oldLockbin = nacl.sign.keyPair.fromSecretKey(oldKeySgn).publicKey,
						oldLock = nacl.util.encodeBase64(oldLockbin).replace(/=+$/,'');
						
				}else{													//prompt for old password
					$('#oldKeyScr').dialog("open");
					throw('stopped for old key input')
				}
				
				if(type == '#'){
					idKey = makeShared(convertPubStr(theirLock),oldKey)
				}else{
					if(lastKeyCipher){	
						lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
						idKey = makeShared(convertPubStr(theirLock),lastKey);
					}else{
						lastKey = myKey;
						idKey = makeShared(convertPubStr(theirLock),lastKey);
					}
				}
				idTag = symEncrypt(oldLock,nonce24,idKey).slice(0,9);
				for (i = 1; i < cipherArray.length; i++){
					if (idTag == cipherArray[i]) {
					var msgKeycipher = cipherArray[i+1];
				}
			}
			if(typeof msgKeycipher != 'undefined'){				//got it finally
				if(type == '#'){
					sharedKey = makeShared(convertPubStr(theirLock),oldKey)
				}
			}else{													//otherwise really give up
				if(type == '#'){
					failedDecrypt('idSigned')
				}else{
					failedDecrypt('idReadonce')
				}
			}
		}
	}

	//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
	if (type == '#'){					//signed mode
		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt('signed');

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last character
	}else{
		var newLockCipher = msgKeycipher.slice(0,79),
			typeChar = msgKeycipher.slice(-1);
		msgKeycipher = msgKeycipher.slice(79,-1);
		var newLock = symDecrypt(newLockCipher,nonce24,idKey);

		if(typeChar == 'r'){											//if reset type, delete ephemeral data first
			locDir[theirEmail][1] = locDir[theirEmail][2] = null;
		}

		if(typeChar == 'p'){															//PFS mode: last Key and new Lock
			var	sharedKey = makeShared(newLock,lastKey);

		}else if(typeChar == 'r'){														//reset. lastKey is the permanent one
			var	sharedKey = makeShared(newLock,myKey);

		}else{																			//Read-once mode: last Key and last Lock
			var lastLockCipher = locDir[theirEmail][2];
			if (lastLockCipher != null) {												//if stored dummy Lock exists, decrypt it
				var lastLock = keyDecrypt(lastLockCipher)
			} else {																	//use new dummy if no stored dummy
				var lastLock = newLock
			}
			var	sharedKey = makeShared(lastLock,lastKey);
		}

		var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
		if(!msgKey) failedDecrypt('readonce');
		locDir[theirEmail][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
		locDir[theirEmail][3] = 'lock';

		syncChromeLock(theirEmail,JSON.stringify(locDir[theirEmail]))
	}
}
	//final decryption for the main message
	var plainstr = symDecrypt(cipher,nonce24,msgKey);

	if(!plainstr.toLowerCase().match('data:;')) plainstr = LZString.decompressFromBase64(plainstr);
	if(type != '@'){
		readBox.innerHTML = plainstr;
	}else{																	//add further instructions if it was an invitation
		readBox.innerHTML = "Congratulations! You have decrypted your first message with <b>PassLok for Email</b>. This is my message to you:<blockquote><em>" + plainstr + "</em></blockquote><br>Do this to reply to me with an encrypted message:<ol><li>Click the <b>Compose</b> or <b>Reply</b> button on your email program.</li><li>Type in my email address, if it's not there already, and a subject line, but <em>don't write your message yet</em>. Then click the <b>PassLok</b> logo (orange key near the bottom).</li><li>A new window will appear, and there you can write your reply securely.</li><li>After writing your message, click either <b>Signed Encrypt</b> (both of us will be able to decrypt the message multiple times) or <b>Read-once Encrypt</b> (only one decryption is possible).</li><li>The encrypted message will appear in the compose window. Add whatever plain text you want, and click <b>Send</b>.</li></ol>"
	}

	syncLocDir();															//everything OK, so store
	readMsg.innerHTML = 'Decrypt successful';
	callKey = '';
}