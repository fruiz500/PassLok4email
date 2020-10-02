//recognize browser
var	isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
	isFirefox = typeof InstallTrigger !== 'undefined';
	
//set global variables indicating if there is a Chrome sync data area (Chrome), otherwise set to local (old Firefox).
if(chrome.storage){
	if(chrome.storage.sync){
		var ChromeSyncOn = true,
			chromeStorage = chrome.storage.sync
	}else{
		var ChromeSyncOn = false,
			chromeStorage = chrome.storage.local
	}
}else{
	var ChromeSyncOn = false,
		chromeStorage = localStorage
}

//initializations
window.onload = function() {
	resetBtn.addEventListener('click',resetPFS);
	readHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	keyHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"})
	});
	decoyBtn.addEventListener('click',doDecoyDecrypt);
	loadEncrFile.addEventListener('change',loadEncryptedFile);
	loadEncrFile.addEventListener('click',function(){this.value = '';});
	decryptFileBtn.addEventListener('click',function(){this.value = '';});
	myLockBtn.addEventListener('click',showLock);
	readInterfaceBtn.addEventListener('click',switchReadButtons);
	
	encryptBtn.addEventListener('click',encrypt);
	encryptFileBtn.addEventListener('click',encrypt2file);
	encryptImageFile.addEventListener('change',loadEncryptImage);
	encryptImageFile.addEventListener('click',function(){this.value = '';});
	inviteBtn.addEventListener('click',inviteEncrypt);
	interfaceBtn.addEventListener('click',switchButtons);
	compHelpBtn.addEventListener('click',function(){
		chrome.runtime.sendMessage({newtab: "helpTab"}, function (response) {
			console.log(response.farewell)
		});
	});
	resetBtn2.addEventListener('click',resetPFS);
	moveBtn.addEventListener('click',moveDB);
		
//event listeners for the rich text toolbar boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

	toolBar2.children[0].addEventListener("click", function() {formatDoc('bold')});
	toolBar2.children[1].addEventListener("click", function() {formatDoc('italic')});
	toolBar2.children[2].addEventListener("click", function() {formatDoc('underline')});
	toolBar2.children[3].addEventListener("click", function() {formatDoc('strikethrough')});
	toolBar2.children[4].addEventListener("click", function() {formatDoc('subscript')});
	toolBar2.children[5].addEventListener("click", function() {formatDoc('superscript')});
	toolBar2.children[6].addEventListener("click", function() {formatDoc('justifyleft')});
	toolBar2.children[7].addEventListener("click", function() {formatDoc('justifycenter')});
	toolBar2.children[8].addEventListener("click", function() {formatDoc('justifyright')});
	toolBar2.children[9].addEventListener("click", function() {formatDoc('justifyfull')});
	toolBar2.children[10].addEventListener("click", function() {formatDoc('insertorderedlist')});
	toolBar2.children[11].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	toolBar2.children[12].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	toolBar2.children[13].addEventListener("click", function() {formatDoc('outdent')});
	toolBar2.children[14].addEventListener("click", function() {formatDoc('indent')});
	toolBar2.children[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	toolBar2.children[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	toolBar2.children[17].addEventListener("click", function() {formatDoc('unlink')});
	toolBar2.children[18].addEventListener("click", function() {formatDoc('removeFormat')});
	toolBar2.children[19].addEventListener("click", function() {formatDoc('undo')});
	toolBar2.children[20].addEventListener("click", function() {formatDoc('redo')});
	imgFile.addEventListener('change', loadImage);
	imgFile.addEventListener('click', function(){this.value = '';});
	mainFile.addEventListener('change', loadFile);
	mainFile.addEventListener('click', function(){this.value = '';});
	
	suggestPwdBtn.addEventListener('click',suggestPwd);
	pwdIcon.addEventListener('click',function(){showPwd('pwd')});
	acceptPwdBtn.addEventListener('click',acceptpwd);
	pwdBox.addEventListener('keyup',function(event){boxKeyup('pwd',event)});
		
	oldPwdIcon.addEventListener('click',function(){showPwd('oldPwd')});
	cancelOldPwdBtn.addEventListener('click',cancelOldPwd);
	acceptOldPwdBtn.addEventListener('click',acceptoldPwd);
	oldPwdBox.addEventListener('keyup',function(event){boxKeyup('oldPwd',event)});
		
	cancelNameBtn.addEventListener('click',cancelName);
	acceptNameBtn.addEventListener('click',storeNewLock);
		
	cancelChatBtn.addEventListener('click',cancelChat);
	makeChatBtn.addEventListener('click',makeChat);
	chatDate.addEventListener('keyup',charsLeftChat);
		
	cancelChat2Btn.addEventListener('click',cancelAcceptChat);
	acceptChatBtn.addEventListener('click',acceptChat);
		
	cancelCoverBtn.addEventListener('click',cancelStego);
	acceptCoverBtn.addEventListener('click',acceptCover);
		
	cancelDecoyInBtn.addEventListener('click',cancelDecoyIn);
	acceptDecoyInBtn.addEventListener('click',encrypt);
	decoyText.addEventListener('keyup',charsLeftDecoy);
	decoyInIcon.addEventListener('click',function(){showPwd('decoyIn')});
	decoyInBox.addEventListener('keyup',function(event){boxKeyup('decoyIn',event)});
		
	cancelDecoyOutBtn.addEventListener('click',cancelDecoyOut);
	acceptDecoyOutBtn.addEventListener('click',doDecoyDecrypt);
	decoyOutIcon.addEventListener('click',function(){showPwd('decoyOut')});
	decoyOutBox.addEventListener('keyup',function(event){boxKeyup('decoyOut',event)});
		
	encodePNGBtn.addEventListener('click',encodePNG);
	encodeJPGBtn.addEventListener('click',encodeJPG);	
	decodeImgBtn.addEventListener('click',acceptstegoImage);
	stegoImageIcon.addEventListener('click',function(){showPwd('stegoImage')});
	stegoImageBox.addEventListener('keyup',function(event){boxKeyup('stegoImage',event)});
	
	cancelSymmetricBtn.addEventListener('click',cancelsymmetric);
	acceptSymmetricBtn.addEventListener('click',acceptsymmetric);
	symmetricIcon.addEventListener('click',function(){showPwd('symmetric')});
	symmetricBox.addEventListener('keyup',function(event){boxKeyup('symmetric',event)});

//UI areas hidden by default
	moreReadButtons.style.display = 'none';
	firstTimeKey.style.display = 'none';
	moreComposeButtons.style.display = 'none';
	inviteBtn.style.display = 'none';
	checkBoxes.style.display = 'none';
	moveBtn.style.display = 'none';

	myEmail = window.location.hash.slice(1);		//get myEmail from the request to open the popup, without waiting for a follow-up message
	reformKeys();									//in case I just switched from a different service
	retrieveAllSync();
	
//listeners from content page	
	chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
					
			if(request.message == "read_bgdata"){				//get data from existing email, sent by content script to background script
				myEmail = request.myEmail;						//in case myEmail has changed since the popup was opened (switching to a different service?)
				theirEmail = request.theirEmail;
				text2decrypt = request.bodyText;
				soleRecipient = request.soleRecipient;
				senderBox.textContent = theirEmail;
				serviceName = request.serviceName;
				reformKeys();							//email service may have changed, so reform keys if needed
				callKey = 'decrypt';
				doAction()

			}else if(request.message == "compose_bgdata"){		//get data from compose box, sent by content script to background script
				myEmail = request.myEmail;
				reformKeys();
				emailList = request.emailList;
				if(emailList) soleRecipient = emailList.length > 1;
				activeTab = request.activeTab;
				serviceName = request.serviceName;
				if(!activeTab) activeTab = sender.tab;			//when received directly from content script
				if(emailList) composeRecipientsBox.textContent = emailList.join(', ');
				composeBox.innerHTML = decryptSanitizer(request.bodyText);					//put in what was in email compose
				if(composeBox.innerHTML) composeMsg.textContent = "It is best to click the PassLok icon before you type anything in the email compose box"
				callKey = 'compose';
				doAction()

			}else if(request.message == "keys_fromBg"){			//get cached keys from background
				if(request.KeyStr){
					KeyStr = request.KeyStr;
					myKey = new Uint8Array(32);				    //must be Uint8Array type
					for(var i = 0; i < 32; i++) myKey[i] = request.myKey[i];
					myLockbin = new Uint8Array(32);
					for(var i = 0; i < 32; i++) myLockbin[i] = request.myLockbin[i];
					myLock = request.myLock;
					myezLock = request.myezLock;
					locDir = request.locDir;
					prevServiceName = request.prevServiceName;
				}
				if(!popupReady){chrome.runtime.sendMessage({message: "popup_ready"}); popupReady = true}		//now it's really ready

			}else if(request.message == "delete_keys"){			//delete cached keys
				myKey = '';
				KeyStr = '';
				myLockbin = '';
				myLock = '';
				myezLock = '';
				LocDir = {};
				prevServiceName = '';
				pwdMsg.textContent = 'Your Password has expired. Please enter it again';
				pwdMsg.style.color = ''

			}else if(request.message == "ready?"){				//background is waiting to send something
				chrome.runtime.sendMessage({message: "popup_ready"})

			}else if(request.message.slice(-3) == 'Scr'){		//open a certain screen from background. Not used at the moment
				openScreen(request.message)
			}
	  	}
	);
	var popupReady = false;										//not yet ready, until stored keys are received from bg
	chrome.runtime.sendMessage({message: "retrieve_keys"});
//	time10 = hashTime10();											//get milliseconds for 10 wiseHash at iter = 10
	time10 = 200;				//about right for 10 wiseHash at iter = 10 on a core2-duo
}

//Firefox needs to know when the popup closes
window.onbeforeunload = function(){
	chrome.runtime.sendMessage({message: "popup_closed"})
}