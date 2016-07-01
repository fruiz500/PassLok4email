var tempLock;
//stores new Lock, copies old one just in case
function storeNewLock(){
	if(locDir[theirEmail]){
		tempLock = locDir[theirEmail][0]
	}
	locDir[theirEmail][0] = theirLock;
	storeData(theirEmail);
	$('#nameScr').dialog("close");
	decrypt()
}

//to store data in Chrome sync
function storeData(email){
	if(locDir){
		if(email){
			syncChromeLock(email,JSON.stringify(locDir[email]))		//sync only one entry
		}else{
			syncLocDir()													//sync everything
		}
	}
}

var resetRequested = false;
//this is to just delete the Read-once data for a particular email
function resetPFS(){
	if(!resetRequested){				//sets flag so action happens on next click
		resetRequested = true;
		readMsg.innerHTML = "If you click <strong>Reset</strong> again, the current conversation will be reset. This cannot be undone";
		resetBtn.style.background = '#FB5216';
		resetBtn.style.color = 'white';
		setTimeout(function() {
			resetRequested = false;
			resetBtn.style.background = '';
			resetBtn.style.color = ''
		}, 10000)								//forget request after 10 seconds

	}else{
		var email = senderBox.innerText.trim();
		if ((locDir[email][1] == null) && (locDir[email][2] == null)){
			readMsg.innerText = 'Nothing to reset';
			throw('no Read-once data')
		}
		locDir[email][1] = locDir[email][2] = null;
		locDir[email][3] = 'reset';
		storeData(email);
		readMsg.innerText = "Conversation reset. The next reply won't have perfect forward secrecy";
		resetBtn.style.background = '';
		resetSpan.style.display = 'none';
		resetRequested = false
	}
}

//same, but from the compose screen
function resetPFS2(){
	if(!resetRequested){				//sets flag so action happens on next click
		if(composeRecipientsBox.innerText.split(', ').length > 1){
			composeMsg.innerText = 'Can reset only a single correspondent';
			return;
		}
		resetRequested = true;
		composeMsg.innerHTML = "If you click <strong>Reset</strong> again, the current conversation will be reset. This cannot be undone";
		resetBtn2.style.background = '#FB5216';
		resetBtn2.style.color = 'white';
		setTimeout(function() {
			resetRequested = false;
			resetBtn2.style.background = '';
			resetBtn2.style.color = ''
		}, 10000)								//forget request after 10 seconds

	}else{
		var email = composeRecipientsBox.innerText.trim();
		if ((locDir[email][1] == null) && (locDir[email][2] == null)){
			readMsg.innerText = 'Nothing to reset';
			throw('no Read-once data')
		}
		locDir[email][1] = locDir[email][2] = null;
		locDir[email][3] = 'reset';
		storeData(email);
		composeMsg.innerText = "Conversation reset. The next reply won't have perfect forward secrecy";
		resetBtn2.style.background = '';
		resetSpan2.style.display = 'none';
		resetRequested = false
	}
}

//to put Lock into sync storage
function syncChromeLock(name,data) {
	var syncName = myEmail + '.' + name;
    var jsonfile = {};
    jsonfile[syncName.toLowerCase()] = data;
    chromeStorage.set(jsonfile);

	//now update the list, also in Chrome sync
	updateChromeSyncList()
}

//to update the stored list
function updateChromeSyncList(){
	var ChromeSyncList = Object.keys(locDir).join('|');
	var jsonfile = {};
	jsonfile[myEmail+'.ChromeSyncList'] = ChromeSyncList;
	chromeStorage.set(jsonfile)
}

//to retrieve Lock from sync storage. The code specifying what to do with the item is here because the get operation is asynchronous
function getChromeLock(name) {
	var syncName = myEmail + '.' + name;
    chromeStorage.get(syncName.toLowerCase(), function (obj) {
		var lockdata = obj[syncName.toLowerCase()];
		if(lockdata){
			storeChromeLock(name,lockdata)
		}
	})
}

//this one is called by the above function
function storeChromeLock(name,lockdata){
	locDir[name] = JSON.parse(lockdata);
	updateChromeSyncList()
}

//to completely remove an entry
function remChromeLock(name) {
	var syncName = myEmail + '.' + name;
    chromeStorage.remove(syncName.toLowerCase());
	updateChromeSyncList()
}

//save all to sync storage
function syncLocDir(){
	for(var name in locDir){
		syncChromeLock(name,JSON.stringify(locDir[name]))	//sync all entries
	}
}

//this one controls an asynchronous loop
var asyncLoop = function(o){
    var i=-1;

    var loop = function(){
        i++;
        if(i==o.length){o.callback(); return;}
        o.functionToLoop(loop, i)
    }
    loop()	//init
}

//get Lock list from Chrome sync, then call an asynchronous loop to retrieve the data
function retrieveAllSync(){
	var syncName = myEmail + '.ChromeSyncList';
	chromeStorage.get(syncName, function (obj) {
		var lockdata = obj[syncName];
		if(lockdata){
			var ChromeSyncList = lockdata.split('|');
				
//asynchronous loop to fill local directory				
			asyncLoop({
				length : ChromeSyncList.length,
	
				functionToLoop : function(loop, i){
					var syncName2 = myEmail + '.' + ChromeSyncList[i];
					var lockdata2 = {};
					chromeStorage.get(syncName2.toLowerCase(), function (obj) {
						lockdata2 = obj[syncName2.toLowerCase()];
						locDir[ChromeSyncList[i]] = JSON.parse(lockdata2)
					});
					loop()				
    			},
	
    			callback : function(){	//not used here
				}    
			})		
//end of asynchronous loop, any code below won't wait for it to be done

		} else {introGreeting()}			//display special messages for a first-time user 
	})
}

var wipeEnabled = false;
//makes encrypted backup of the whole DB, then if confirmed wipes local data clean. This is taken from SeeOnce
function moveDB(){
	if(composeBox.innerText.match('href="data:,==~') && wipeEnabled){			//delete data the second time
		locDir = {};
		if(!ChromeSyncOn) chrome.storage.local.clear();	
		composeMsg.innerText = 'Local data wiped';
		moveBtn.style.background = '';
		moveBtn.innerText = 'Backup';
		wipeEnabled = false

	}else{													//normal backup
		callKey = 'movedb';
		readKey();

		//first clean out keys in locDir that don't have any real data
		for (var Lock in locDir){
			if (!locDir[Lock][0]){
				delete locDir[Lock];
				remChromeLock(Lock)		//remove from storage as well
			}
		}
		if(!locDir && ChromeSyncOn) chrome.storage.sync.remove('ChromeSyncList');		//remove index if empty

		//now encrypt it with the user Password
		composeBox.innerHTML = 'The link below is an encrypted backup containing data needed to continue conversations in course. Right-click on it and save it locally. Load it as you would an encrypted attachment and the data will be restored.<br><br><a download="PLbak.txt" href="data:,==' + keyEncrypt(JSON.stringify(locDir)) + '=="><b>PassLok encrypted database; right-click and Save link as...</b></a><br><br>If now you click the button again, the data will be erased from the app.';
		composeMsg.innerText = 'Backup in the box.\nIf you click the same button again, it will be wiped from this machine and others in sync. This cannot be undone.';
		moveBtn.style.background = '#FB5216';
		moveBtn.style.color = 'white';
		moveBtn.innerText = 'Wipe';
		wipeEnabled = true;
		setTimeout(function() {
			moveBtn.style.background = '';
			moveBtn.style.color = '';
			moveBtn.innerText = 'Backup';
			wipeEnabled = false;
		}, 10000)							//cancel after 10 seconds
		selectMain();
		updateComposeButtons('');
		callKey = ''
	}
}

//merges two objects; doesn't sort the keys
function mergeObjects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}