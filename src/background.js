//this one opens tabs as directed by the extension
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
            chrome.extension.getBackgroundPage().console.log('resp.type');
            console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
            if (request.newtab == "helpTab") {
                chrome.tabs.create({url: 'help.html'});
                sendResponse({farewell: "goodbye"});
            }else if(request.newtab == "chatTab") {
				var typetoken = request.typetoken;
				chrome.tabs.create({url: 'chat/index.html#' + typetoken.slice(43)});
				sendResponse({farewell: "goodbye"});
			}
      }
);