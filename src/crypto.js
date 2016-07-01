//selects the encryption mode and starts it
function encrypt(){
	callKey = 'encrypt';
	readKey();
	if(stegoMode.checked){var lengthLimit = 10000}else{var lengthLimit = 71000};
	if(!chatMode.checked && composeBox.innerHTML.length > lengthLimit){
		var reply = confirm("This item is too long to be encrypted directly into the email and likely will be clipped by the server, rendering it undecryptable. We suggest to cancel and encrypt to file instead, then attach the file to your email");
		if(!reply) throw('text is too long for encrypting to email')
	}
	if(stegoMode.checked) enterCover();
	if(chatMode.checked){
		displayChat()
	}else{
		var emailArray = composeRecipientsBox.innerText.split(',');
		for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
		encryptList(emailArray,false);
		isChatInvite = false	
	}
}

//selects the encryption mode and starts it, but outputs to file instead. Chat not an option
function encrypt2file(){
	callKey = 'encrypt2file';
	readKey();
	if(stegoMode.checked) enterCover();
	var emailArray = composeRecipientsBox.innerText.split(',');
	for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
	encryptList(emailArray,true);
	isChatInvite = false
}

var text2decrypt = '';	
//function that starts it all when the read screen loads
function decrypt(){
	callKey = 'decrypt';
	readKey();
	var text = text2decrypt;
	if(text.match('==')) text = text.split('==')[1];
	text = text.replace(/<(.*?)>/gi,"");
	if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')) fromLetters(text);		//if hidden text
	decryptList();
	openChat()
}

//same but for locking
function signedEncrypt(){
	var emailArray = composeRecipientsBox.innerText.split(',');
	for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
	encryptList(emailArray,false);
	isChatInvite = false
}

function readOnceEncrypt(){
	var emailArray = composeRecipientsBox.innerText.split(',');
	for(var i = 0; i < emailArray.length; i++) emailArray[i] = emailArray[i].trim();
	encryptList(emailArray,true)
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
		}, 10000)								//forget request after 10 seconds

	}else{
		callKey = 'inviteEncrypt';
		readKey();
		var nonce = nacl.randomBytes(9),
			nonce24 = makeNonce24(nonce),
			noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
			text = composeBox.innerHTML.trim();
  		var cipherstr = symEncrypt(text,nonce24,myLockbin,true);												//the actual message is compressed
		setTimeout(function(){composeMsg.innerText = "This invitation can be decrypted by anyone"},20);
		var output = myezLock + "@" + noncestr + cipherstr;
		output = output.match(/.{1,80}/g).join("\n");
		composeBox.innerHTML = "<br>The gibberish below contains a message from me that has been encrypted with <b>PassLok for Email</b>. To decrypt it, do this:<ol><li>Install the PassLok for Email extension by following one of these links: <ul><li>Chrome:&nbsp; https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh</li><li>Firefox:&nbsp; https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email/</li></ul></li><li>Reload your email and get back to this message.</li><li>Click the <b>PassLok</b> logo above (orange key). You will be asked to supply a Password, which will not be stored or sent anywhere. You must remember the Password, but you can change it later if you want.</li><li>When asked whether to accept my new Password (which you don't know), go ahead and click <b>OK</b>.</li><li>If you don't use Chrome or Firefox, or don't want to install an extension, you can also open the message in PassLok Privacy, a standalone app available from https://passlok.com</li></ol><br><pre>----------begin invitation message encrypted with PassLok--------==<br><br>" + output + "<br><br>==---------end invitation message encrypted with PassLok-----------</pre>";
		var bodyElement = document.getElementById(bodyID);
		bodyElement.insertBefore(composeBox,bodyElement.childNodes[0]);

		$('#composeScr').dialog("close");
		inviteRequested = false;
		callKey = ''
	}
}

//encrypts for a list of recipients, as emails in listArray. First makes a 256-bit message key, then gets the Lock for each recipient and encrypts the message key with it
//the output string contains each encrypted key along with 66 bits of an encrypted form of the recipient's Lock, so he/she can find the right encrypted key
//two modes: Signed, and ReadOnce
function encryptList(listArray,isFileOut){
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
		composeMsg.innerText = 'None of these recipients are in your directory. You should send them an invitation first.';
		return
	}
	if(!onceMode.checked) encryptArray.push(myEmail);						//copy to myself unless read-once
	encryptArray = shuffle(encryptArray);							//extra precaution

	var	msgKey = nacl.randomBytes(32),
		nonce = nacl.randomBytes(15),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = composeBox.innerHTML;
		
	var padding = decoyEncrypt(59,nonce24,myKey);					//this for decoy mode

	var cipher = symEncrypt(text,nonce24,msgKey,true);					//main encryption event including compression, but don't add the result yet

	if(onceMode.checked){													//add type marker, nonce, and padding for decoy msg
		var outString = myezLock + '$' + noncestr + padding
	}else{
		var outString = myezLock + '?' + noncestr + padding
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
			if(!onceMode.checked){													//for Signed mode
				var sharedKey = makeShared(convertPubStr(Lock),myKey),
					cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
					idTag = symEncrypt(Lock,nonce24,sharedKey);
			}else{																	//for Read-once mode

				if(email != myEmail){								//can't do Read-once to myself
					var lastKeyCipher = locDir[email][1],
						lastLockCipher = locDir[email][2],				//retrieve dummy Lock from storage, [0] is the permanent Lock by that name
						turnstring = locDir[email][3],
						secdum = nacl.randomBytes(32),							//different dummy key for each recipient
						typeChar = '';

					if(turnstring == 'reset'){
						typeChar = 'r';
						var resetMessage = true
					}else if(turnstring == 'unlock'){
						typeChar = 'p';
						var pfsMessage = true
					}else{
						typeChar = 'o'
					}
										
					if (lastKeyCipher){
						var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher));
					} else {													//use new dummy Key if stored dummy doesn't exist
						var lastKey = secdum;
						typeChar = 'p';
						var pfsMessage = true
					}
										
					if(!turnstring){										//initial message to be handled the same as a reset
						typeChar = 'r';
						var resetMessage = true
					}

					if (lastLockCipher) {								//if dummy exists, decrypt it first
						var lastLock = keyDecrypt(lastLockCipher)
					} else {													//use permanent Lock if dummy doesn't exist
						var lastLock = convertPubStr(Lock)
					}

					var sharedKey = makeShared(lastLock,lastKey);
					
					var idKey = makeShared(lastLock,myKey);

					var cipher2 = nacl.util.encodeBase64(nacl.secretbox(msgKey,nonce24,sharedKey)).replace(/=+$/,''),
						idTag = symEncrypt(Lock,nonce24,idKey);

					if(turnstring != 'lock'){															//if out of turn don't change the dummy Key, this includes reset
						var newLockCipher = symEncrypt(makePubStr(lastKey),nonce24,idKey);
					}else{
						var	newLockCipher = symEncrypt(makePubStr(secdum),nonce24,idKey);
					}
					if(turnstring == 'lock' || !lastKeyCipher){
						locDir[email][1] = keyEncrypt(nacl.util.encodeBase64(secdum));				//new Key is stored in the permanent database
					}
					if(turnstring != 'reset') locDir[email][3] = 'unlock';
					
				}else{
					if(encryptArray.length < 2){
						composeMsg.innerText = 'In Read-once mode, you must select recipients other than yourself.';
						throw('only myself for Read-once')
					}
				}
			}
			if(onceMode.checked){
				if(email != myEmail) outString += '-' + idTag.slice(0,9) + '-' + newLockCipher + cipher2 + typeChar;
			}else{
				outString += '-' + idTag.slice(0,9) + '-' + cipher2;
			}
		}
	}
	//all recipients done at this point

	//finish off by adding the encrypted message and tags
	outString += '-' + cipher;
	if(stegoMode.checked) outString = textStego(outString);
	
	var outNode = document.createElement('div');								//output node not sanitized because it is made by encryption
	if(isFileOut){
		if(stegoMode.checked){
			outNode.innerHTML = '<a download="ChangeMe.txt" href="data:,==' + outString + '=="><b>PassLok Hidden message; right-click and select Save Link As... Make sure to change the name</b></a>'
		}else if(onceMode.checked){
			outNode.innerHTML = '<a download="PLmso.txt" href="data:,==' + outString + '=="><b>PassLok Read-once message; right-click and select Save Link As...</b></a>'
		}else{
			outNode.innerHTML = '<a download="PLmss.txt" href="data:,==' + outString + '=="><b>PassLok Signed message; right-click and select Save Link As...</b></a>'
		}
	}else{
		if(stegoMode.checked){
			outNode.innerText = outString
		}else if(invisibleMode.checked){
			outNode.innerHTML = 'Invisible message below this line<div style="display:none !important">==' + outString + '==</div>'
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

	syncLocDir();
	callKey = '';
	visibleMode.checked = true;
	decoyMode.checked = false;
	if(isFileOut){
		composeMsg.innerText = "Contents encrypted into a file. Now save it, close this dialog, and attach the file to your email"
		composeBox.innerText = '';
		composeBox.appendChild(outNode);
	}else{
		var bodyElement = document.getElementById(bodyID);
		bodyElement.insertBefore(outNode,bodyElement.childNodes[0]);
	}
	if(inviteArray.length != 0){		 
		composeMsg.innerText = 'The following recipients have been removed from your encrypted message because they are not yet in your directory:\n' + inviteArray.join(', ') + '\nYou should send them an invitation first. You may close this dialog now'
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

//encrypts a string with the secret Key, 12 char nonce
function keyEncrypt(plainstr){
	plainstr = encodeURI(plainstr).replace(/%20/g,' ');			//in case there are any special characters
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce),
		cipherstr = symEncrypt(plainstr,nonce24,myKey).replace(/=+$/,'');
	return '~' + noncestr + cipherstr
}

//decrypts a string encrypted with the secret Key, 12 char nonce. Returns original if not encrypted
function keyDecrypt(cipherstr){
	if (cipherstr.charAt(0) == '~'){
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
	string = string.replace(/[\s\n]/g,'').replace(/&nbsp;/g,'');							//remove spaces, newlines
	if(string.match('==')) string = string.split('==')[1];									//keep only PassLok item, if bracketed
	string = string.replace(/<(.*?)>/gi,"").replace(/[^a-zA-Z0-9+\/@?$-~]+/g,''); 		//takes out html tags and anything that is not base64 or a type marker
	return string
}

//to make sure attached Lock is correct
function isBase36(string){
	var result = true;
	for(var i = 0; i < string.length; i++){
		if(base36.indexOf(string.charAt(i)) == '-1') result = false
	}
	return result
}

var padding = '', nonce24;			//global variables involved in decoding secret message
//decrypts a message encrypted for multiple recipients. Encryption can be Signed, Read-once, or an Invitation. This is detected automatically. It can also be an encrypted database
function decryptList(){
	readBox.innerText = '';
	var text = stripHeaders(text2decrypt);											//get the data from a global variable holding it
	theirEmail = senderBox.innerText.trim();
	if(isBase36(text.slice(0,50)) && !isBase36(text.charAt(50))){					//find Lock located at the start
		theirLock = changeBase(text.slice(0,50),base36,base64,true)
		
	}else if(text.charAt(0) == '~'){													//it's an encrypted database, so decrypt it and merge it
		var agree = confirm('This is an encrypted local database. It will be loaded if you click OK, possibly replacing current data. This cannot be undone.');
		if(!agree){
			readBox.innerText = '';
			readMsg.innerText = 'Backup merge canceled';
			return
		}
		var newData = JSON.parse(keyDecrypt(text));
		locDir = mergeObjects(locDir,newData);
		syncLocDir();
		readBox.innerText = '';
		readMsg.innerText = 'Data from backup merged';
		return
		
	}else{
		readBox.innerText = '';
		readMsg.innerText = 'This message is not encrypted, but perhaps the attachments are';
		throw('illegal Lock at the start')
	}
	
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
		readMsg.innerText = "This message contains only the sender's Lock. Nothing to decrypt";
		throw("empty message")
	}
	
	var	type = text.charAt(0);
	text = text.slice(1);
	var cipherArray = text.split('-'),
		stuffForId = myLock;
	if(type == '@'){
		var noncestr = text.slice(0,12),						//shorter nonce for invitations, no padding
			cipher = text.slice(12);
		padding = ''	
	}else{
		var noncestr = cipherArray[0].slice(0,20),
			cipher = cipherArray[cipherArray.length - 1];
		padding = cipherArray[0].slice(20,120)
	}
	nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));			//these are global variables so they can be read when decryption completes

	if (type == '$' && theirEmail == myEmail){
		readMsg.innerText = 'You cannot decrypt Read-once messages to yourself';
		throw('Read-once message to myself')
	}
	if(type == '?'){														//signed mode
		var sharedKey = makeShared(convertPubStr(theirLock),myKey),
			idKey = sharedKey;

	}else if(type == '$'){													//Read-once mode
		if (locDir[theirEmail]){
			var	lastKeyCipher = locDir[theirEmail][1],
				lastLockCipher = locDir[theirEmail][2],
				turnstring = locDir[theirEmail][3];									//this strings says whose turn it is to encrypt
		}

		if(lastKeyCipher){													//now make idTag
			var lastKey = nacl.util.decodeBase64(keyDecrypt(lastKeyCipher)),
				idKey = makeShared(convertPubStr(theirLock),lastKey);
		}else{														//if a dummy Key doesn't exist, use permanent Key
			var lastKey = myKey,
				idKey = makeShared(convertPubStr(theirLock),myKey);
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
				
					if(type == '?'){
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
					if(type == '?'){
						sharedKey = makeShared(convertPubStr(theirLock),oldKey)
					}
				}else{													//otherwise really give up
					if(type == '?'){
						failedDecrypt('idSigned')
					}else{
						failedDecrypt('idReadonce')
					}
				}
			}
		}

		//got the encrypted message key so now decrypt it, and finally the main message. The process for PFS and Read-once modes is more involved.
		if (type == '?'){					//signed mode
			var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
			if(!msgKey) failedDecrypt('signed');

//for Read-once mode, first we separate the encrypted new Lock from the proper message key, then decrypt the new Lock and combine it with the stored Key (if any) to get the ephemeral shared Key, which unlocks the message Key. The particular type of encryption (Read-once or PFS) is indicated by the last character
		}else{
			var newLockCipher = msgKeycipher.slice(0,79),
				typeChar = msgKeycipher.slice(-1);
			msgKeycipher = msgKeycipher.slice(79,-1);
			var newLock = symDecrypt(newLockCipher,nonce24,idKey);

			if(typeChar == 'p'){															//PFS mode: last Key and new Lock
				var	sharedKey = makeShared(newLock,lastKey);

			}else if(typeChar == 'r'){														//reset. lastKey is the permanent one
				var agree = confirm('If you go ahead, the current Read-once conversation with the sender will be reset. This may be OK if this is a new message, but if it is an old one the conversation will go out of sync');
				if(!agree) throw('reset decrypt canceled');
				var	sharedKey = makeShared(newLock,myKey);
				locDir[theirEmail][1] = locDir[theirEmail][2] = null;					//if reset type, delete ephemeral data first

			}else{																			//Read-once mode: last Key and last Lock
				var lastLockCipher = locDir[theirEmail][2];
				if (lastLockCipher != null) {												//if stored dummy Lock exists, decrypt it
					var lastLock = keyDecrypt(lastLockCipher)
				}else{																	//use new dummy if no stored dummy
					var lastLock = newLock
				}
				var	sharedKey = makeShared(lastLock,lastKey)
			}

			var msgKey = nacl.secretbox.open(nacl.util.decodeBase64(msgKeycipher),nonce24,sharedKey);
			if(!msgKey) failedDecrypt('readonce');
			locDir[theirEmail][2] = keyEncrypt(newLock);										//store the new dummy Lock (final storage at end)
			locDir[theirEmail][3] = 'lock';

			syncChromeLock(theirEmail,JSON.stringify(locDir[theirEmail]))
		}
	}
	//final decryption for the main message, which is also compressed
	var plainstr = symDecrypt(cipher,nonce24,msgKey,true);
	plainstr = safeHTML(plainstr);										//sanitize what is about to be put in the DOM, based on a whitelist

	readBox.innerText = '';	
	if(type != '@'){
		readBox.innerHTML = plainstr;
	}else{																	//add further instructions if it was an invitation
		plainstr = "Congratulations! You have decrypted your first message with <b>PassLok for Email</b>. This is my message to you:<blockquote><em>" + plainstr + "</em></blockquote><br>Do this to reply to me with an encrypted message:<ol><li>Click the <b>Compose</b> or <b>Reply</b> button on your email program.</li><li>Type in my email address, if it's not there already, and a subject line, but <em>don't write your message yet</em>. Then click the <b>PassLok</b> logo (orange key near the bottom).</li><li>A new window will appear, and there you can write your reply securely.</li><li>After writing your message (and optionally selecting the encryption mode), click the <b>Encrypt to email</b> button.</li><li>The encrypted message will appear in the compose window. Add whatever plain text you want, and click <b>Send</b>.</li></ol>";
		readBox.innerHTML = plainstr
	}

	syncLocDir();															//everything OK, so store

	if(typeChar == 'r'){ 
			readMsg.innerText = 'You have just decrypted the first message or one that resets a Read-once conversation. This message can be decrypted again, but doing so after more messages are exchanged will cause the conversation to go out of sync. It is best to delete it to prevent this possibility'
		}else if(typeChar == 'o'){
			readMsg.innerText = 'Decryption successful. This message cannot be decrypted again'
		}else if(typeChar == 'p'){
			readMsg.innerText = 'Decryption successful. This message will become un-decryptable after you reply'
		}else{
			readMsg.innerText = 'Decryption successful'
		}
	callKey = ''
}

//displays how many characters are left in decoy message
function charsLeftDecoy(){
	var chars = encodeURI(decoyText.value).replace(/%20/g, ' ').length;
	var limit = 59;
	if (chars <= limit){
		decoyMsg.innerText = chars + " characters out of " + limit + " used"
	}else{
		decoyMsg.innerHTML = '<span style="color:orange">Maximum length exceeded. The message will be truncated</span>'
	}
}

//encrypts a hidden message into the padding included with list encryption, or makes a random padding also encrypted so it's indistinguishable
function decoyEncrypt(length,nonce24,seckey){
	if (decoyMode.checked){
		if(typeof(decoyPwdIn) == "undefined"){
			showDecoyInDialog();
			throw ("stopped for decoy input")			
		}
		if (!decoyPwdIn.value.trim() || !decoyText.value.trim()){ 					//stop to display the decoy entry form if there is no hidden message or key
			showDecoyInDialog();
			throw ("stopped for decoy input")
		}
		var keystr = decoyPwdIn.value,
			text = encodeURI(decoyText.value.replace(/%20/g, ' '));
		var keyStripped = stripHeaders(keystr);

		if (keyStripped.length == 43 || keyStripped.length == 50){						//the key is a Lock, so do asymmetric encryption
			if (keyStripped.length == 50) keyStripped = changeBase(keyStripped.toLowerCase().replace(/l/g,'L'), base36, base64, true) //ezLock replaced by regular Lock
			var sharedKey = makeShared(convertPubStr(keyStripped),seckey);
		}else{
			var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24));			//symmetric encryption for true shared key
		}
		decoyPwdIn.value = "";
		decoyText.value = "";
		$('#decoyIn').dialog("close");
		showDecoyInCheck.checked = false

	} else {																		//no decoy mode, so salt comes from random text and key
		var sharedKey = nacl.randomBytes(32),
			text = nacl.util.encodeBase64(nacl.randomBytes(44)).replace(/=+$/,'')
	}
	while (text.length < length) text = text + ' ';				//add spaces to make the number of characters required
	text = text.slice(0,length);
	var cipher = symEncrypt(text,nonce24,sharedKey);
	return cipher
}

//decrypt the message hidden in the padding, for decoy mode
function decoyDecrypt(cipher,nonce24,dummylock){
	if(typeof(decoyPwdOut) == "undefined"){
		showDecoyOutDialog();
		throw ("stopped for decoy input")			
	}	
	if (!decoyPwdOut.value.trim()){					//stop to display the decoy key entry form if there is no key entered
		showDecoyOutDialog();
		throw ("stopped for decoy input")
	}
	var keystr = decoyPwdOut.value;
	decoyPwdOut.value = ""	;

	try{															//this may fail if the string is corrupted, hence the try
		var cipher = nacl.util.decodeBase64(cipher);
	}catch(err){
		readMsg.innerText = "The hidden message seems to be corrupted or incomplete";
		throw('decodeBase64 failed')
	}

	var sharedKey = wiseHash(keystr,nacl.util.encodeBase64(nonce24)),							//try symmetric mode first
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
	if(!plain){																//not a shared key, so try asymmetric
		sharedKey = makeShared(dummylock,ed2curve.convertSecretKey(nacl.sign.keyPair.fromSeed(wiseHash(keystr,myEmail)).secretKey));
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
	}
	
	$('#decoyOut').dialog("close");
	showDecoyOutCheck.checked = false;
	if(!plain) failedDecrypt('decoy');									//give up
	readMsg.innerHTML = 'Hidden message: <span style="color:blue">' + safeHTML(decodeURI(nacl.util.encodeUTF8(plain))) + '</span>'
}

//does decoy decryption after a button is clicked
function doDecoyDecrypt(){
	decoyDecrypt(padding,nonce24,convertPubStr(theirLock))
}
