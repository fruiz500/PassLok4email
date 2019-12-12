//opens tabs as directed by the extension and communicates with popup
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {

            if (request.newtab == "helpTab") {							//open Help page in new tab
                chrome.tabs.create({url: '../html/help.html'})
				
            }else if(request.newtab == "chatTab") {						//open chat page in new tab
				var typetoken = request.typetoken;
				chrome.tabs.create({url: 'https://passlok.com/chat/index.html#' + typetoken.slice(43)})
			
	  		}else if(request.message == "read_data"){					//got data from existing email, now send it to popup
				myEmail = request.myEmail;
				theirEmail = request.theirEmail;
				text2decrypt = request.bodyText;
				soleRecipient = request.soleRecipient;
				serviceName = request.serviceName;
				popupType = 'read';
				openPopup()												//needed to wake up the popup

			}else if(request.message == "compose_data"){					//data from compose box, to be sent to popup
				myEmail = request.myEmail;
				emailList = request.emailList;
				text2decrypt = request.bodyText;
				serviceName = request.serviceName;
				activeTab = sender.tab;
				popupType = 'compose';
				openPopup()

			}else if(request.message == "popup_ready"){					//needed so the popup can get relayed data after it loads or responds
				if(popupType == 'read'){
					chrome.runtime.sendMessage({message: 'read_bgdata', myEmail: myEmail, theirEmail: theirEmail, bodyText: text2decrypt, soleRecipient: soleRecipient, serviceName: serviceName})				
				}else if(popupType == 'compose'){
					chrome.runtime.sendMessage({message: 'compose_bgdata', myEmail: myEmail, emailList: emailList, bodyText: text2decrypt, activeTab: activeTab, serviceName: serviceName})
				}
				popupOpen = true

			}else if(request.message == "preserve_keys"){				//cache keys from popup, so they are available from it loads again
				KeyStr = request.KeyStr;
				myKey = request.myKey;
				myLockbin = request.myLockbin;
				myLock = request.myLock;
				myezLock = request.myezLock;
				locDir = request.locDir;
				prevServiceName = request.prevServiceName;
				resetTimer()

			}else if(request.message == "retrieve_keys"){				//send cached keys to popup
				chrome.runtime.sendMessage({message: 'keys_fromBg', KeyStr: KeyStr, myKey: myKey, myLockbin: myLockbin, myLock: myLock, myezLock: myezLock, locDir: locDir, prevServiceName: prevServiceName});
				resetTimer()

			}else if(request.message == "reset_timer"){					//another 5 minutes before cached keys expire
				resetTimer()

			}else if(request.message == "reset_now"){					//delete cached keys now
				resetNow()

			}else if(request.message == "popup_closed"){					//reset flag so popup is created again
				popupOpen = false
			}  
      }
);

//global variables to store in background, since popup is ephemeral
var myKey,KeyStr,myLockbin,myLock,myezLock,myEmail,theirEmail,text2decrypt,emailList,activeTab,soleRecipient,locDir,prevServiceName;

//recognize browser
var	isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
	isFirefox = typeof InstallTrigger !== 'undefined',
	popupOpen = false;

//global variables used for password expiration
var keytimer = 0;

//erases the secret values after 5 minutes
function resetTimer(){
	var period = 300000;
	clearTimeout(keytimer);

	//start timer to reset Password box
	keytimer = setTimeout(function() {
		resetNow();
		chrome.runtime.sendMessage({message: 'delete_keys'})		//also delete in popup
	}, period)
}

//resets the Keys in memory immediately, except myEmail
function resetNow(){
	myKey = '';
	KeyStr = '';
	myLockbin = '';
	myLock = '';
	myezLock = '';
	locDir = {};
	prevServiceName = ''
}

var popupParams = "scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=610,height=244";
var popup, popupType = 'read';

//opens popup on key entry dialog
function openPopup(){
	if(!popupOpen){
		if(isFirefox){
			popup = chrome.windows.create({url:'../html/popup.html#' + myEmail, width:816, height:366, type:'popup'})			//not resizable, though
		}else{
			popup = window.open('../html/popup.html#' + myEmail,'popup',popupParams)		//add myEmail to hashtag, needed to retrieve locDir
		}
	}else{
		chrome.runtime.sendMessage({message: 'ready?'})
	}
	popup.focus()
}
