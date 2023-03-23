//opens popup on key entry dialog
function openPopup(){
	//first ask if the popup is open
	chrome.runtime.sendMessage(			//a positive answer will cause data to be sent. No receiving end opens popup
		{message: 'ready?'},
		function(){
			if(chrome.runtime.lastError.message.includes("Could not")){
				chrome.windows.create({url:'/html/popup.html#' + myEmail, width:816, height:366, type:'popup', focused:true})
			}
		}
	);
}

//opens tabs as directed by the extension and communicates with popup
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {

            if (request.newtab == "helpTab") {							//open Help page in new tab
                chrome.tabs.create({url: '/html/help.html'})
				
            }else if(request.newtab == "chatTab") {						//open chat page in new tab
				chrome.tabs.create({url: 'https://passlok.com/chat/chat.html#' + request.typetoken})
			
	  		}else if(request.message == "read_data"){					//got data from existing email, now send it to popup
				myEmail = request.myEmail;
				theirEmail = request.theirEmail;
				text2decrypt = request.bodyText;
				soleRecipient = request.soleRecipient;
				serviceName = request.serviceName;
				activeTab = sender.tab;
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
				popupOpen = true;
				if(popupType == 'read'){
					chrome.runtime.sendMessage({message: 'read_bgdata', myEmail: myEmail, theirEmail: theirEmail, bodyText: text2decrypt, soleRecipient: soleRecipient, activeTab: activeTab, serviceName: serviceName})				
				}else if(popupType == 'compose'){
					chrome.runtime.sendMessage({message: 'compose_bgdata', myEmail: myEmail, emailList: emailList, bodyText: text2decrypt, activeTab: activeTab, serviceName: serviceName})
				}

			}else if(request.message == "popup_closed"){					//clear cached password etc. Likely never triggered
				chrome.storage.session.clear()
			}  
      }
);

//resets cached data after 5 minutes of inactivity
chrome.alarms.onAlarm.addListener(function(result){
	if(result.name == "PLEAlarm"){
		chrome.storage.session.clear();
		chrome.runtime.sendMessage({message: "delete_keys"}, function(response) {
			var lastError = chrome.runtime.lastError;
			if (lastError) {
				console.log(lastError.message);
				// 'Could not establish connection. Receiving end does not exist.'
				return;
			}
			// Success, do something with response...
		})
	}
});
