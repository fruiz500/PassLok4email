/*
		@source: https://github.com/fruiz500/PassLok4email

        @licstart  The following is the entire license notice for the
        code in this extension.

        Copyright (C) 2019  Francisco Ruiz

        The JavaScript and html code in this page is free software: you can
        redistribute it and/or modify it under the terms of the GNU
        General Public License (GNU GPL) as published by the Free Software
        Foundation, either version 3 of the License, or (at your option)
        any later version.  The code is distributed WITHOUT ANY WARRANTY;
        without even the implied warranty of MERCHANTABILITY or FITNESS
        FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

        As additional permission under GNU GPL version 3 section 7, you
        may distribute non-source (e.g., minimized or compacted) forms of
        that code without the copy of the GNU GPL normally required by
        section 4, provided you include this license notice and a URL
        through which recipients can access the Corresponding Source.


        @licend  The above is the entire license notice
        for the code in this extension.
*/

//icon to be inserted in email pages
var PLicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUBAMAAAB/pwA+AAAAGFBMVEUAAAD8cT77Uhb//Pr7WyH/2cv+ooL/8eyW2r6lAAAAAXRSTlMAQObYZgAAAFZJREFUCNdjQAWhocFQFrOQkmMCjOmkpAZlirilOMJEBRgVDaBM4RQ4U1RFjQHGVEqGMcXTGeDagCRMG1amOAM2tW5pATA3KKnBmS6OUCZDaWlpAapnAO5QC8JQ9jftAAAAAElFTkSuQmCC';

//This animation strategy inspired by http://blog.streak.com/2012/11/how-to-detect-dom-changes-in-css.html
//based on http://davidwalsh.name/detect-node-insertion changes will depend on CSS as well.
var insertListener = function(event) {
	if (event.animationName == "composeInserted") {
		composeIntercept()
	}
}

document.addEventListener("animationstart", insertListener, false); // standard + firefox
document.addEventListener("webkitAnimationStart", insertListener, false);


//the rest is for integrating the code with certain web mail servers
var serviceName = window.location.hostname;							//to detect Gmail, Yahoo, etc.
if(serviceName.match('google')){ serviceName = 'google'
}else if(serviceName.match('yahoo')){ serviceName = 'yahoo'
}else if(serviceName.match('live')){ serviceName = 'outlook'
}

//to retrieve the user's own email address
function getMyEmail(){
  if(document.title){
	if(serviceName == 'google'){
		myEmail = document.title.split('-')[1].trim()
	}else if(serviceName == 'yahoo'){
		myEmail = document.title.match(/[a-z0-9]+@yahoo.com/)[0]
	}else if(serviceName == 'outlook'){
		myEmail = document.title.split('-')[1].replace(/ /g,'').trim()		//no spaces so it can sync with the browser
	}
  }
}

//returns the ancestor node, given the separation. 0 is for direct parent
function ancestor(el,separation){
	var parent = el.parentNode;
	for(var i = 0; i < separation; i++) parent = parent.parentNode;
	return parent
}

var soleRecipient = false;

//reply when polled in order to keep popup window alive
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(request.message == "is_script_there"){
			chrome.runtime.sendMessage({message: "script_here"})
		}				
  	}
);

//detects compose or read areas and places buttons in them  
function composeIntercept(ev) {
	//start with Gmail
  if(serviceName == 'google'){
	var composeBoxes = document.querySelectorAll('.bAK');						//toolbar at bottom of window
	if (composeBoxes && composeBoxes.length > 0){

		Array.prototype.forEach.call(composeBoxes, function(element){
			var composeMenu = ancestor(element,2);
			if (composeMenu && composeMenu.querySelector('.passlok') === null){						//insert PassLok icon right after the toolbar icons
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title2", "insert PassLok-encrypted text");
				el.style.position = "relative";
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);

				el.addEventListener('click', function(){						//activate the button
					getMyEmail();
					var bodyDiv = ancestor(this,11).querySelector('.Am');								//this global variable will be used to write the encrypted message
					bodyID = bodyDiv.id;
					var bodyText = bodyDiv.innerHTML.replace(/<(.*?)>/gi,"");					//clean junk tags
					bodyText = bodyText.split('<div style="color: rgb(0, 0, 0);">')[0];		//fix for old reply style
					//PREVIOUS THREAD MESSAGES OPTIONAL
//					var extraText = $(this).parents().eq(11).find('.gmail_extra').html();
//					if(extraText) bodyText += extraText;

					var emails = ancestor(this,12).querySelectorAll('.afV');		//element containing recipient addresses
					var emailList = [];
					for(var i = 0; i < emails.length; i++){
						emailList.push(emails[i].getAttribute("data-hovercard-id"))
					}
//					var subject = $(this).parents().eq(11).find('.aoT').val();

				//send data to background page
   					chrome.runtime.sendMessage({message: "compose_data", myEmail: myEmail, emailList: emailList, bodyText: bodyText, serviceName: serviceName});
					chrome.runtime.onMessage.addListener(					//get ready to insert encrypted data
  					function(request, sender, sendResponse) {
						if(request.message == 'encrypted_data'){
							bodyDiv.innerHTML = request.composeHTML;
							sendResponse({message: "insertion_done"})
						}
  					})
				});
				element.appendChild(el)
			}
		});
	}

//this part for reading messages
	var viewTitleBar = document.querySelectorAll('td[class="gH acX bAm"]');			//title bar at top of message
	if (viewTitleBar && viewTitleBar.length > 0){								//insert PassLok icon right before the other stuff, if there is encrypted data

		Array.prototype.forEach.call(viewTitleBar, function(element){				//insert PassLok icon right before the other stuff, if there is encrypted data
			if (element.querySelectorAll('.passlok').length === 0){
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title", "decrypt with PassLok");
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);

				el.addEventListener('click', function(){
					getMyEmail();
					var theirEmail = ancestor(this,5).querySelector('.gD').getAttribute('email');			//sender's address
					var recipients = ancestor(this,5).querySelectorAll('.g2');
					soleRecipient = (recipients.length < 2);												//this is used when decrypting images
					var bodyElement = ancestor(this,5).querySelector('.a3s');
					var bodyText = bodyElement.innerHTML;
					if(bodyText.match('ajU"')) bodyText = bodyText.split('ajU"')[0] + '>';			//leave out quoted text, completing final tag so it can be filtered out
//					var subject = $(this).parents().eq(16).find('.hP').text();

   					chrome.runtime.sendMessage({message: "read_data", myEmail: myEmail, theirEmail: theirEmail, bodyText: bodyText, soleRecipient: soleRecipient, serviceName: serviceName})
				});
				element.insertBefore(el, element.firstChild)
			}
		});
	}

	//now the same for Yahoo
  }else if(serviceName == 'yahoo'){
	var composeBoxes = document.querySelectorAll('.bottomToolbar,[data-test-id="compose-toolbar-styler"]');				//toolbar at bottom of window
	if (composeBoxes && composeBoxes.length > 0){

		Array.prototype.forEach.call(composeBoxes, function(element){
			var composeMenu = element;
			if (composeMenu && composeMenu.querySelector('.passlok') === null){						//insert PassLok icon right after the toolbar icons
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title2", "insert PassLok-encrypted text");
				el.style.position = "relative";
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);

				el.addEventListener('click', function(){						//activate the button
					getMyEmail();
					var bodyDiv = ancestor(this,3).querySelector('.cm-rtetext,[data-test-id="rte"]');
					bodyID = bodyDiv.id;								//this global variable will be used to write the encrypted message, should be "rtetext"
					if(!bodyID){bodyID = "bodyText"; bodyDiv.id = "bodyText"};
					var bodyText = bodyDiv.innerHTML.replace(/<(.*?)>/gi,"");				//clean junk tags
					bodyText = bodyText.split('<hr')[0];								//take out quoted stuff
					//PREVIOUS THREAD MESSAGES OPTIONAL
//					var extraText = $(this).parents().eq(11).find('.gmail_extra').html();
//					if(extraText) bodyText += extraText;

					var emails = ancestor(this,3).querySelectorAll('.pill-content');		//element containing recipient addresses
					var emailList = [];
					for(var i = 0; i < emails.length; i++){
						emailList.push(emails[i].getAttribute("title").match(/<(.*?)>/)[1])
					}
//					var subject = $(this).parents().eq(11).find('.aoT').val();

					chrome.runtime.sendMessage({message: "compose_data", myEmail: myEmail, emailList: emailList, bodyText: bodyText, serviceName: serviceName});
					chrome.runtime.onMessage.addListener(					//get ready to insert encrypted data
  					function(request, sender, sendResponse) {
						if(request.message == 'encrypted_data'){
							bodyDiv.innerHTML = request.composeHTML;
							sendResponse({message: "insertion_done"})
						}
  					})
				});
				var lastPalette = element.children[6];
				lastPalette.parentNode.insertBefore( el, lastPalette.nextSibling ) 
			}
		});
	}

//this part for reading messages
	var viewTitleBar = document.querySelectorAll('.thread-info, .msg-date, [data-test-id="message-date"]');			//title bar at top of message
	if (viewTitleBar && viewTitleBar.length > 0){

		Array.prototype.forEach.call(viewTitleBar, function(element){			//insert PassLok icon right before the other stuff, if there is encrypted data
			if (element.querySelectorAll('.passlok').length === 0){
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title", "decrypt with PassLok");
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);
				
				el.addEventListener('click', function(){
					getMyEmail();
					var theirEmail = ancestor(this,1).querySelector('.u_N').textContent.replace(/[^A-Za-z\.\@]/g,'');			//sender's address
					var recipients = ancestor(this,1).querySelectorAll('.D_F .rtlI_dz_sSg');									//includes sender
					if(recipients){
						soleRecipient = (recipients.length < 3)
					}else{
						soleRecipient = false
					}
					var bodyElement = ancestor(this,3).querySelector('.msg-body');
					var bodyText = bodyElement.innerHTML;
//					var subject = $(this).parents().eq(16).find('.hP').text();

					chrome.runtime.sendMessage({message: "read_data", myEmail: myEmail, theirEmail: theirEmail, bodyText: bodyText, soleRecipient: soleRecipient, serviceName: serviceName});
				});
				element.insertBefore(el, element.firstChild)
			}
		});
	}

	//now the same for Outlook
  }else if(serviceName == 'outlook'){
	var composeBoxes = document.querySelectorAll("[aria-label='Discard']");        		//toolbar at bottom
	if (composeBoxes && composeBoxes.length > 0){

		Array.prototype.forEach.call(composeBoxes, function(element){
			var composeMenu = ancestor(element,1);
			if (composeMenu && composeMenu.querySelector('.passlok') === null){		//insert PassLok icon right after the toolbar icons
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title2", "insert PassLok-encrypted text");
				el.style.position = "relative";
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);

				el.addEventListener('click', function(){						//activate the button
					getMyEmail();
					var bodyAreas = ancestor(this,3).querySelectorAll("[role='textbox']");
					var bodyDiv = bodyAreas[bodyAreas.length - 1];			//take the last box as there may be several
					bodyDiv.id = "bodyText";
					bodyID = "bodyText";									//this global variable will be used to write the encrypted message
					var bodyText = bodyDiv.textContent;
					//PREVIOUS THREAD MESSAGES OPTIONAL
//					var extraText = $(this).parents().eq(11).find('.gmail_extra').html();
//					if(extraText) bodyText += extraText;

					var emails = ancestor(this,3).querySelectorAll("[aria-label^='Opens Profile'], [class*='wellItemText']");		//element containing recipient addresses
					var emailList = [];
					for(var i = 1; i < emails.length; i++){			//ignore the first, which is the sender
						var address = emails[i].parentElement.querySelector('[class*="wellItemText"], [aria-label^="Opens Profile"]').textContent.replace(/ /g,'').trim();
						emailList.push(address)
					}
					emails = ancestor(this,3).querySelectorAll("[class*='recipientClass']");		//if contentEditable
					for(var i = 0; i < emails.length; i++){
						emailList.push(emails[i].textContent.slice(0,-1).replace(/<(.*?)>/,'').replace(/ /g,'').trim())
					}
//					var subject = $(this).parents().eq(11).find('.aoT').val();

					chrome.runtime.sendMessage({message: "compose_data", myEmail: myEmail, emailList: emailList, bodyText: bodyText, serviceName: serviceName});
					chrome.runtime.onMessage.addListener(					//get ready to insert encrypted data
  					function(request, sender, sendResponse) {
						if(request.message == 'encrypted_data'){
							bodyDiv.innerHTML = request.composeHTML;
							sendResponse({message: "insertion_done"})
						}
  					})
				});
				composeMenu.insertBefore(el, composeMenu.children[1]) 
			}
		});
	}
	
//this part for reading messages
	var viewTitleBar = document.querySelectorAll("[aria-label='Reply all']");			//reply icon at top of message
	if (viewTitleBar && viewTitleBar.length > 0){

		Array.prototype.forEach.call(viewTitleBar, function(element){			//insert PassLok icon right before the other stuff, if there is encrypted data
			var bar = ancestor(element,2);
			if (bar.querySelectorAll('.passlok').length === 0){
				var el = document.createElement("a");
				el.href = "#";
				el.className = "passlok";
				el.setAttribute("data-title", "decrypt with PassLok");
				var logo = document.createElement("img");
				logo.src = PLicon;
				el.appendChild(logo);
				
				el.addEventListener('click', function(){
					getMyEmail();
					var theirEmail = ancestor(this,8).children[0].textContent.replace(/<(.*?)>/,'').replace(/ /g,'').trim();
					var recipients = ancestor(this,9).querySelectorAll("[aria-label^='Opens Profile']");
					soleRecipient = (recipients.length < 4);							
					var bodyText = ancestor(this,10).children[2].textContent;

					chrome.runtime.sendMessage({message: "read_data", myEmail: myEmail, theirEmail: theirEmail, bodyText: bodyText, soleRecipient: soleRecipient, serviceName: serviceName})
				});
				bar.insertBefore(el, bar.firstChild)
			}
		});
	}
  }
}