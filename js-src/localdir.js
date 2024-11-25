var tempLock;

//stores new Lock, copies old one just in case
function storeNewLock(){
	if(locDir[theirEmail]){
		tempLock = locDir[theirEmail][0]
	}
	locDir[theirEmail][0] = theirLock;
	storeData(theirEmail);
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
	var box = composeScr.style.display == 'block' ? 'compose' : 'read';			//figure out which screen we're in
	if(!resetRequested){				//sets flag so action happens on next click
		if(box == 'compose' && composeRecipientsBox.textContent.split(', ').length > 1){
			composeMsg.textContent = 'Can reset only a single correspondent';
			return
		}
		resetRequested = true;
		document.getElementById(box + 'Msg').textContent = "If you click Reset again, the current conversation will be reset. This cannot be undone";
		this.style.background = '#FB5216';
		this.style.color = 'white';
		var button = this;						//to reset button after delay
		setTimeout(function() {
			resetRequested = false;
			button.style.background = '';
			button.style.color = ''
		}, 10000)								//forget request after 10 seconds

	}else{
		if(box == 'compose'){
			var email = composeRecipientsBox.textContent.trim()
		}else{
			var email = senderBox.textContent.trim()
		}
		if ((locDir[email][1] == null) && (locDir[email][2] == null)){
			readMsg.textContent = 'Nothing to reset';
			return
		}
		locDir[email][1] = locDir[email][2] = null;
		locDir[email][3] = 'reset';
		storeData(email);
		document.getElementById(box + 'Msg').textContent = "Conversation reset. The next reply won't have perfect forward secrecy";
		this.style.background = '';
		this.style.display = 'none';
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
	
    			callback : function(){				//used when the key is freshly entered
					delete locDir['undefined']		//clean up spurious entries
				}    
			})		
//end of asynchronous loop, any code below won't wait for it to be done

		} else {			//display special messages for a first-time user
			introGreeting()
		} 
	})
}

var wipeEnabled = false;

//makes encrypted backup of the whole DB, then if confirmed wipes local data clean. This is taken from SeeOnce
function moveDB(){
	if(composeBox.innerHTML.match('href="data:,==k') && wipeEnabled){			//delete data the second time
		locDir = {};
		if(!ChromeSyncOn) chrome.storage.local.clear();	
		composeMsg.textContent = 'Local data wiped';
		moveBtn.style.background = '';
		moveBtn.textContent = 'Backup';
		wipeEnabled = false

	}else{													//normal backup
		callKey = 'movedb';
		if(!refreshKey()) return;

		//first clean out keys in locDir that don't have any real data
		for (var Lock in locDir){
			if (!locDir[Lock][0]){
				delete locDir[Lock];
				remChromeLock(Lock)		//remove from storage as well
			}
		}
		if(!locDir && ChromeSyncOn) chromeStorage.remove('ChromeSyncList');		//remove index if empty

		//now encrypt it with the user Password
		composeBox.textContent = 'The link below is an encrypted backup containing data needed to continue conversations in course. Right-click on it and save it locally. To restore it, load it as you would an encrypted attachment.\r\n\r\n';
		var fileLink = document.createElement('a');
		fileLink.download = "PLbak.txt";
		fileLink.href = 'data:,==' + keyEncrypt(JSON.stringify(locDir)) + '==';
		fileLink.textContent = "PassLok encrypted database; right-click and Save link as...";
		composeBox.appendChild(fileLink);
		
		moveBtn.style.background = '#FB5216';
		moveBtn.style.color = 'white';
		moveBtn.textContent = 'Wipe';
		wipeEnabled = true;
		setTimeout(function() {
			moveBtn.style.background = '';
			moveBtn.style.color = '';
			moveBtn.textContent = 'Backup';
			wipeEnabled = false;
			composeMsg.textContent = 'Wipe disarmed'
		}, 10000)							//cancel after 10 seconds
		updateComposeButtons('');
		composeMsg.textContent = 'Backup in the box.\r\nIf you click the button again while red, it will be wiped from this machine and others in sync. This cannot be undone.';
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
