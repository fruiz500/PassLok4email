/*
		@source: https://github.com/fruiz500/PassLok4email

        @licstart  The following is the entire license notice for the
        code in this page.

        Copyright (C) 2016  Francisco Ruiz

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
        for the code in this page.
*/

//this file contains the interface and jQuery stuff to load the different parts of it and extract data from or inject into email client
  
//global variables involved in interface. Mostly flags.
var rootElement = $(document),
  	readCreated = false,
	composeCreated = false,
	keyCreated = false,
	oldKeyCreated = false,
	nameCreated = false,
	chatCreated = false,
	acceptChatCreated = false,
	bodyID = '';

//html code for dialogs
	
//toolbar for rich text editing
var toolbarHTML = '<div id="toolBar1" style="display:none;">'+
    '<select id="formatBlock" title="headings, etc.">'+
      '<option selected>- formatting -</option>'+
      '<option value="h1">Title 1 &lt;h1&gt;</option>'+
      '<option value="h2">Title 2 &lt;h2&gt;</option>'+
      '<option value="h3">Title 3 &lt;h3&gt;</option>'+
      '<option value="h4">Title 4 &lt;h4&gt;</option>'+
      '<option value="h5">Title 5 &lt;h5&gt;</option>'+
      '<option value="h6">Subtitle &lt;h6&gt;</option>'+
      '<option value="p">Paragraph &lt;p&gt;</option>'+
      '<option value="pre">Preformatted &lt;pre&gt;</option>'+
    '</select>'+
    '<select id="fontName" title="font type">'+
      '<option class="heading" selected>- font -</option>'+
      '<option>Arial</option>'+
      '<option>Arial Black</option>'+
      '<option>Courier New</option>'+
      '<option>Times New Roman</option>'+
      '<option>Verdana</option>'+
      '<option>Comic Sans MS</option>'+
      '<option>Impact</option>'+
      '<option>Trebuchet MS</option>'+
      '<option>Symbol</option>'+
    '</select>'+
    '<select id="fontSize" title="font size">'+
      '<option class="heading" selected>- size -</option>'+
      '<option value="1">Very small</option>'+
      '<option value="2">A bit small</option>'+
      '<option value="3">Normal</option>'+
      '<option value="4">Medium-large</option>'+
      '<option value="5">Big</option>'+
      '<option value="6">Very big</option>'+
      '<option value="7">Maximum</option>'+
    '</select>'+
    '<select id="foreColor" title="text color">'+
      '<option class="heading" selected>- color -</option>'+
      '<option value="brown">Brown</option>'+
      '<option value="red">Red</option>'+
      '<option value="orange">Orange</option>'+
      '<option value="green">Green</option>'+
      '<option value="blue">Blue</option>'+
      '<option value="purple">Violet</option>'+
      '<option value="violet">Pink</option>'+
      '<option value="yellow">Yellow</option>'+
      '<option value="cyan">Cyan</option>'+
      '<option value="white">White</option>'+
      '<option value="gray">Gray</option>'+
      '<option value="black">Black</option>'+
    '</select>'+
    '<select id="backColor" title="color behind the text">'+
      '<option class="heading" selected>- back color -</option>'+
      '<option value="brown">Brown</option>'+
      '<option value="red">Red</option>'+
      '<option value="orange">Orange</option>'+
      '<option value="green">Green</option>'+
      '<option value="blue">Blue</option>'+
      '<option value="purple">Violet</option>'+
      '<option value="violet">Pink</option>'+
      '<option value="yellow">Yellow</option>'+
      '<option value="cyan">Cyan</option>'+
      '<option value="white">White</option>'+
      '<option value="gray">Gray</option>'+
      '<option value="black">Black</option>'+
    '</select>'+
    <!--rich text editing buttons; images are loaded as data-->
    '<div id="toolBar2">'+
	   '<img class="intLink" title="Bold" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAInhI+pa+H9mJy0LhdgtrxzDG5WGFVk6aXqyk6Y9kXvKKNuLbb6zgMFADs="/>'+
	   '<img class="intLink" title="Italic" src="data:image/gif;base64,R0lGODlhFgAWAKEDAAAAAF9vj5WIbf///yH5BAEAAAMALAAAAAAWABYAAAIjnI+py+0Po5x0gXvruEKHrF2BB1YiCWgbMFIYpsbyTNd2UwAAOw=="/>'+
	   '<img class="intLink" title="Underline" src="data:image/gif;base64,R0lGODlhFgAWAKECAAAAAF9vj////////yH5BAEAAAIALAAAAAAWABYAAAIrlI+py+0Po5zUgAsEzvEeL4Ea15EiJJ5PSqJmuwKBEKgxVuXWtun+DwxCCgA7"/>'+
	   '<img class="intLink" title="Strikethrough" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAGFBMVEUAAABGRkZxcXGrq6uOjo7CwsINDQ3p6emLJhauAAAAAXRSTlMAQObYZgAAAEVJREFUGNNjoCYoDjaBs1UZDGFMVmUGJhibXcidFa7GUVAVygpSUlJMS0uBqmFgFhSA6TVgYIOxmcUZ2BxgbEFnF2o6HQD3yAWvJ+vXvwAAAABJRU5ErkJggg=="/>'+
	   '<img class="intLink" title="Subscript" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAGFBMVEUAAACCgoJISEh0pePr7/WgssrS0tLH1vP156UFAAAAAXRSTlMAQObYZgAAAElJREFUGNNjoB5gDBQRFICy2YQCAhNgEomqAghFSg5wNosSkniQGktwAURYlFEp2d0AIiyYpKTGbICwJBihnd2kBM5mNjagzPEAztoHvc+7u1sAAAAASUVORK5CYII="/>'+
	   '<img class="intLink" title="Superscript" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAGFBMVEUAAACCgoJISEigssrr7/V0pePS0tLH1vPtoVcWAAAAAXRSTlMAQObYZgAAAEpJREFUGNNjoC5gCTaAs5ndAxASrBA2o6GIoICpA5jNJmhg6B5SApFPUhZgDQ2AalRyQBioJABnMxqpwYWFGZUMYMKCSUpqlDocAJ7SBzNIUMnCAAAAAElFTkSuQmCC"/>'+
	   '<img class="intLink" title="Left align" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAIghI+py+0Po5y02ouz3jL4D4JMGELkGYxo+qzl4nKyXAAAOw=="/>'+
	   '<img class="intLink" title="Center align" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAIfhI+py+0Po5y02ouz3jL4D4JOGI7kaZ5Bqn4sycVbAQA7"/>'+
	   '<img class="intLink" title="Right align" src="data:image/gif;base64,R0lGODlhFgAWAID/AMDAwAAAACH5BAEAAAAALAAAAAAWABYAQAIghI+py+0Po5y02ouz3jL4D4JQGDLkGYxouqzl43JyVgAAOw=="/>'+
	   '<img class="intLink" title="Justify" src="data:image/gif;base64,R0lGODlhFgAWAIAAAMDAwAAAACH5BAEAAAAALAAAAAAWABYAAAIghI+py+0Po2yh2nvnxNxq2XVfFHIjVGLnk2brC8fyXAAAOw=="/>'+
	   '<img class="intLink" title="Numbered list" src="data:image/gif;base64,R0lGODlhFgAWAMIGAAAAADljwliE35GjuaezxtHa7P///////yH5BAEAAAcALAAAAAAWABYAAAM2eLrc/jDKSespwjoRFvggCBUBoTFBeq6QIAysQnRHaEOzyaZ07Lu9lUBnC0UGQU1K52s6n5oEADs="/>'+
	   '<img class="intLink" title="Dotted list" src="data:image/gif;base64,R0lGODlhFgAWAMIGAAAAAB1ChF9vj1iE33mOrqezxv///////yH5BAEAAAcALAAAAAAWABYAAAMyeLrc/jDKSesppNhGRlBAKIZRERBbqm6YtnbfMY7lud64UwiuKnigGQliQuWOyKQykgAAOw=="/>'+
	   '<img class="intLink" title="Quote" src="data:image/gif;base64,R0lGODlhFgAWAIQXAC1NqjFRjkBgmT9nqUJnsk9xrFJ7u2R9qmKBt1iGzHmOrm6Sz4OXw3Odz4Cl2ZSnw6KxyqO306K63bG70bTB0rDI3bvI4P///////////////////////////////////yH5BAEKAB8ALAAAAAAWABYAAAVP4CeOZGmeaKqubEs2CekkErvEI1zZuOgYFlakECEZFi0GgTGKEBATFmJAVXweVOoKEQgABB9IQDCmrLpjETrQQlhHjINrTq/b7/i8fp8PAQA7"/>'+
	   '<img class="intLink" title="Delete indentation" src="data:image/gif;base64,R0lGODlhFgAWAMIHAAAAADljwliE35GjuaezxtDV3NHa7P///yH5BAEAAAcALAAAAAAWABYAAAM2eLrc/jDKCQG9F2i7u8agQgyK1z2EIBil+TWqEMxhMczsYVJ3e4ahk+sFnAgtxSQDqWw6n5cEADs="/>'+
	   '<img class="intLink" title="Add indentation" src="data:image/gif;base64,R0lGODlhFgAWAOMIAAAAADljwl9vj1iE35GjuaezxtDV3NHa7P///////////////////////////////yH5BAEAAAgALAAAAAAWABYAAAQ7EMlJq704650B/x8gemMpgugwHJNZXodKsO5oqUOgo5KhBwWESyMQsCRDHu9VOyk5TM9zSpFSr9gsJwIAOw=="/>'+
	   '<img class="intLink" title="Horizontal rule" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAGFBMVEUAAADIyMimpqbp6enz8/P8/PzZ2dldXV27aT9/AAAAAXRSTlMAQObYZgAAAD5JREFUGNNjoBg4GSDYSgpYFCQKgkECiC0aGuLi7GwsAGILKYGBABYt5QUwVoiZuJhJAITN6mxs7Apk0wIAACMpB/oWEo0pAAAAAElFTkSuQmCC"/>'+
	   '<img class="intLink" title="Hyperlink" src="data:image/gif;base64,R0lGODlhFgAWAOMKAB1ChDRLY19vj3mOrpGjuaezxrCztb/I19Ha7Pv8/f///////////////////////yH5BAEKAA8ALAAAAAAWABYAAARY8MlJq7046827/2BYIQVhHg9pEgVGIklyDEUBy/RlE4FQF4dCj2AQXAiJQDCWQCAEBwIioEMQBgSAFhDAGghGi9XgHAhMNoSZgJkJei33UESv2+/4vD4TAQA7"/>'+
	   '<img class="intLink" title="Remove hyperlink" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWBAMAAAA2mnEIAAAAGFBMVEUAAAD08fHXzcxjY2OMhoafn5+uLyrktrTVXxhsAAAAAXRSTlMAQObYZgAAAGxJREFUGNNjwAAFMAZjEkMCYyKUU6aQoAaTYU90TIcrFwBCCFANDWIKDVUAMZkcBUVZBQWDQGwWERcnJhcXETBbBUEyKzubsjobK4PYrEZCwsxCQqZgc4KNTVmMjQOQzIfbW5jOgOYehDspAwBt9Q/S3exo3wAAAABJRU5ErkJggg=="/>'+
	   '<img class="intLink" title="Remove formatting" src="data:image/gif;base64,R0lGODlhFgAWAIQbAD04KTRLYzFRjlldZl9vj1dusY14WYODhpWIbbSVFY6O7IOXw5qbms+wUbCztca0ccS4kdDQjdTLtMrL1O3YitHa7OPcsd/f4PfvrvDv8Pv5xv///////////////////yH5BAEKAB8ALAAAAAAWABYAAAV84CeOZGmeaKqubMteyzK547QoBcFWTm/jgsHq4rhMLoxFIehQQSAWR+Z4IAyaJ0kEgtFoLIzLwRE4oCQWrxoTOTAIhMCZ0tVgMBQKZHAYyFEWEV14eQ8IflhnEHmFDQkAiSkQCI2PDC4QBg+OAJc0ewadNCOgo6anqKkoIQA7"/>'+
	   '<img class="intLink" title="Undo" src="data:image/gif;base64,R0lGODlhFgAWAOMKADljwliE33mOrpGjuYKl8aezxqPD+7/I19DV3NHa7P///////////////////////yH5BAEKAA8ALAAAAAAWABYAAARR8MlJq7046807TkaYeJJBnES4EeUJvIGapWYAC0CsocQ7SDlWJkAkCA6ToMYWIARGQF3mRQVIEjkkSVLIbSfEwhdRIH4fh/DZMICe3/C4nBQBADs="/>'+
	   '<img class="intLink" title="Redo" src="data:image/gif;base64,R0lGODlhFgAWAMIHAB1ChDljwl9vj1iE34Kl8aPD+7/I1////yH5BAEKAAcALAAAAAAWABYAAANKeLrc/jDKSesyphi7SiEgsVXZEATDICqBVJjpqWZt9NaEDNbQK1wCQsxlYnxMAImhyDoFAElJasRRvAZVRqqQXUy7Cgx4TC6bswkAOw=="/>'+
	 '</div>'+
  '</div>';
	
//read screen
var readHTML = '<div class="passlok-read" id="readScr">'+
	'<div id="readMsg" align="center" style="height:50px;"><p><span style="color:green;">Welcome to PassLok</span></p></div><br>'+
	'<div id="readButtons" style="display: block;" align="center">'+
		'<button class="cssbutton" id="readHelpBtn" value="Help" style="" title="open Help in a new tab">Help</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="saveFileBtn" value="Save file" title="save file to default Downloads folder in original format, or as an html file if type is not recognized">Save file</button>'+
	'</div>'+
	'From:<br><div id="senderBox" contenteditable="false" style="display:inline;"></div>'+
	'<span id="resetSpan">&nbsp;&nbsp;'+
		'<button class="cssbutton" id="resetBtn" value="Reset" style="display:none;" title="reset the current Read-once conversation with this sender">Reset</button>'+
	'</span><br>'+
	'Message:<br><div id="readBox" class="cssbox"></div>'+
'</div>';
	
//compose screen
var composeHTML = '<div class="passlok-compose" id="composeScr">'+
	'<div id="composeMsg" align="center" style="height:50px;"><p><span style="color:green;">Welcome to PassLok</span></p></div><br>'+
	'<div id="composeButtons" style="display: block;" align="center">'+
		'<button class="cssbutton" id="compHelpBtn" value="Help" style="" title="open Help in a new tab">Help</button>&nbsp;&nbsp;'+
		'<span id="encryptButtons">'+
			'<button class="cssbutton" id="encryptBtn" value="Signed" style="" title="encrypt so recipients can decrypt it at will">Signed <b>Encrypt</b></button>&nbsp;&nbsp;'+
			'<button class="cssbutton" id="readOnceBtn" value="Read-once" style="" title="encrypt so it can be decrypted Only Once">Read-once <b>Encrypt</b></button>&nbsp;&nbsp;'+
//			'<button class="cssbutton" id="chatBtn" value="Chat" style="" title="make a chat invitation for these recipients">Chat</button>&nbsp;&nbsp;'+
		'</span>'+
		'<button class="cssbutton" id="inviteBtn" value="Invite" style="" title="invite recipients to PassLok">Invite</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="richBtn" value="Rich" style="" title="display toolbar for rich text editing">Rich</button>&nbsp;&nbsp;'+
		'<input class="custom-file-input" type="file" id="loadFile" style="" title="open dialog to select file to load"/>'+
	'</div>'+
	'To:<br><div id="composeRecipientsBox" contenteditable="false" style="display:inline;"><span style=\"color:red\"><em>Nobody!</em> Please close this dialog and enter the recipients, then try again</span></div>'+
	'<span id="resetSpan2">&nbsp;&nbsp;'+
		'<button class="cssbutton" id="resetBtn2" value="Reset" style="display:none;" title="reset the current Read-once conversation with this sender">Reset</button>'+
	'</span><br>'+
	'Message:<br>' + toolbarHTML + '<div id="composeBox" class="cssbox" contenteditable="true" style="min-height: 100px;"></div>'+
'</div>';
	
//key screen	
var keyHTML = '<div class="passlok-key" id="keyScr">'+
	'<div id="firstTimeKey" align="left" style="width:95%; display:none;">'+
		'<h3 style="color:green;">Welcome to PassLok for email</h3>'+
		'<p>Before you do anything else, you must choose a secret Password, which you will memorize and <strong>will not tell anyone</strong>, and click <strong>OK</strong>.</p>'+
		'<p>Its measured strength will appear above it as you begin to type. If it is worse than Medium, <em>things will be very slow.</em></p>'+
		'<p>Make sure to use $ymbol$, numb3rs, caPiTals, unusual words and mespelingss.</p>'+
		'<p>The <strong>Suggest</strong> button will get you started with five words, which you can modify at will.</p>'+
		'<p>Your Password will not be stored or sent anywhere.</p>'+
		'<div align="center">'+
			'<button class="cssbutton" id="suggestKeyBtn" value="Suggest" title="suggest a Password made of five common words">Suggest</button><br></div><br>'+
		'</div>'+
	'<div id="keyMsg" align="center" style="height:50px;"></div>'+
	'<input type="password" class="cssbox" autocomplete="off" id="pwd" style="" name="text" placeholder="Enter your Password here" align="center"><br><br>'+
	'<div align="center">'+
		'<input type="checkbox" id="showKey" title="reveal box contents">&nbsp;Show&nbsp;&nbsp;'+
		'<button class="cssbutton" id="acceptKeyBtn" value="OK" style="" title="accept Password">OK</button>'+
	'</div>'+
	'<span id="fiveMin"><p>You will need to re-enter your Password if you do not use it for 5 minutes or reload your email app</p></span>'+
'</div>';

//old key dialog
var oldKeyHTML = '<div class="passlok-oldkey" id="oldKeyScr">'+
	'<div id="oldKeyMsg" align="center" style="height:50px;">Looks like you may have changed your Password recently. If you want to continue this conversation, please write the previous Password in the box below and click <strong>OK</strong><br><br>This may also have popped because you tried to decrypt a Read-once message for the 2nd time</div><br>'+
	'<input type="password" class="cssbox" id="oldPwd" style="" name="oldPwd" placeholder="Enter the previous Password here." align="center"><br><br>'+
	'<div align="center">'+
		'<input type="checkbox" id="showOldKey" title="reveal box contents">&nbsp;Show&nbsp;'+
		'<button class="cssbutton" id="cancelOldKeyBtn" value="Cancel" style="" title="cancel old Password">Cancel</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="acceptOldKeyBtn" value="OK" style="" title="accept old Password">OK</button>'+
	'</div>'+
'</div>';

//change name dialog
var nameHTML = '<div class="passlok-name" id="nameScr">'+
	'<div id="nameMsg" align="center" style="height:50px;">This message was locked with a new Password. Please click <strong>OK</strong> to accept it</div><br><br>'+
	'<div align="center">'+
		'<button class="cssbutton" id="cancelNameBtn" value="Cancel" style="" title="cancel change">Cancel</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="acceptNameBtn" value="OK" style="" title="accept change">OK</button>'+
	'</div>'+
'</div>';

//make chat dialog
var chatHTML = '<div class="passlok-chat "id="chatScr">'+
	'Choose the type of chat, then optionally write in the box a message including the date and time<br><br>'+
	'<div align="center">'+
		'<input type="radio" name="chatmodes" id="dataChat"  title="chat with text messages and file exchange" checked/>&nbsp; Text and files&nbsp;&nbsp;'+
		'<input type="radio" name="chatmodes" id="audioChat" title="like Text chat, plus audio"/>&nbsp; Audio&nbsp;&nbsp;'+
		'<input type="radio" name="chatmodes" id="videoChat" title="like audio chat, plus video"/>&nbsp; Video <br><br>'+
	'</div>'+
	'<textarea id="chatDate" class="cssbox" style="" name="chatDate" rows="1" title="additional information" placeholder="Write here the date and time for the chat"></textarea><br><br>'+
	'<div align="center">'+
		'<button class="cssbutton" id="cancelChatBtn" value="Cancel" title="cancel chat invitation">Cancel</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="makeChatBtn" value="OK" title="make chat invitation">OK</button>'+
	'</div>'+
'</div>';

//accept chat dialog
var acceptChatHTML = '<div class="passlok-acceptchat" id="acceptChatScr">'+
	'<div id="chatMsg" align="center" style="height:50px;"></div><br><br>'+
	'<div align="center">'+
		'<button class="cssbutton" id="cancelChat2Btn" value="Cancel" style="" title="cancel chat">Cancel</button>&nbsp;&nbsp;'+
		'<button class="cssbutton" id="acceptChatBtn" value="OK" style="" title="start chat">OK</button>'+
	'</div>'+
'</div>';


//the following functions create popup boxes (modals) using jQuery UI, and extract data from the email client to populate some of them	  
function showReadDialog(email,bodyText){
	var modal;
	if (!readCreated) {
		modal = $(readHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#resetBtn').click(resetPFS);
		modal.find('#readHelpBtn').click(function(){
			chrome.runtime.sendMessage({newtab: "helpTab"}, function (response) {
				console.log(response.farewell);
			});
		});
		modal.find('#saveFileBtn').click(saveURLAsFile); 		
		readCreated = true;  
	}else{
		modal = $('.passlok-read');
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")) modal.dialog({width: 700, title: "PassLok decrypt"});
	
	readScr.style.maxHeight = document.documentElement.clientHeight*0.8 + 'px';
	senderBox.innerText = email;
	readBox.innerHTML = bodyText;
	resetSpan.style.display = 'none';
	decrypt();
}
  
function showComposeDialog(emailList,bodyText) {
	var modal;
	if (!composeCreated) {
		modal = $(composeHTML);
  
	//event listeners; the functions are defined elsewhere
//		modal.find('#chatBtn').click(displayChat);
		modal.find('#encryptBtn').click(signedEncrypt);
		modal.find('#readOnceBtn').click(readOnceEncrypt);
		modal.find('#inviteBtn').click(function(){							//this button has two different functions depending on context
			if(allNew){inviteEncrypt();}else{displayChat();}
		});
		modal.find('#richBtn').click(toggleRichText);
		modal.find('#loadFile').change(loadFileAsURL);
		modal.find('#compHelpBtn').click(function(){
			chrome.runtime.sendMessage({newtab: "helpTab"}, function (response) {
				console.log(response.farewell);
			});
		});
		modal.find('#resetBtn2').click(resetPFS2);
 		
		composeCreated = true;  
	}else{
		modal = $('.passlok-compose');
	}

	if (!modal.dialog("instance") || !modal.dialog("isOpen")) modal.dialog({modal: true, width: 800, title: "PassLok encrypt"});
	
//event listeners for the rich text toolbar boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

	toolBar2.childNodes[0].addEventListener("click", function() {formatDoc('bold')});
	toolBar2.childNodes[1].addEventListener("click", function() {formatDoc('italic')});
	toolBar2.childNodes[2].addEventListener("click", function() {formatDoc('underline')});
	toolBar2.childNodes[3].addEventListener("click", function() {formatDoc('strikethrough')});
	toolBar2.childNodes[4].addEventListener("click", function() {formatDoc('subscript')});
	toolBar2.childNodes[5].addEventListener("click", function() {formatDoc('superscript')});
	toolBar2.childNodes[6].addEventListener("click", function() {formatDoc('justifyleft')});
	toolBar2.childNodes[7].addEventListener("click", function() {formatDoc('justifycenter')});
	toolBar2.childNodes[8].addEventListener("click", function() {ormatDoc('justifyright')});
	toolBar2.childNodes[9].addEventListener("click", function() {formatDoc('justifyfull')});
	toolBar2.childNodes[10].addEventListener("click", function() {formatDoc('insertorderedlist')});
	toolBar2.childNodes[11].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	toolBar2.childNodes[12].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	toolBar2.childNodes[13].addEventListener("click", function() {formatDoc('outdent')});
	toolBar2.childNodes[14].addEventListener("click", function() {formatDoc('indent')});
	toolBar2.childNodes[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	toolBar2.childNodes[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	toolBar2.childNodes[17].addEventListener("click", function() {formatDoc('unlink')});
	toolBar2.childNodes[18].addEventListener("click", function() {formatDoc('removeFormat')});
	toolBar2.childNodes[19].addEventListener("click", function() {formatDoc('undo')});
	toolBar2.childNodes[20].addEventListener("click", function() {formatDoc('redo')});
	
	composeScr.style.maxHeight = document.documentElement.clientHeight*0.8 + 'px';
	if(emailList) composeRecipientsBox.innerText = emailList.join(', ');
	composeBox.innerHTML = bodyText;
	if(bodyText) composeMsg.innerHTML = "It is more secure to type the message <em>after</em> clicking the PassLok button";
	updateComposeButtons(emailList);
	resetSpan2.style.display = 'none';
	composeBox.focus();
}

var allNew = false
//removes some buttons depending on the recipients' list
function updateComposeButtons(emailList){
	allNew = true;	
	for (var index = 0; index < emailList.length; index++){		//scan email array to separate those in the directory from those that are not
		if(locDir[emailList[index].trim()]) allNew = false
	}
	if(allNew){
		encryptButtons.style.display = 'none';
		inviteBtn.innerHTML = 'Invite';
		inviteBtn.title = 'invite recipients to PassLok';
		setTimeout(function(){composeMsg.innerHTML = 'None of these recipients are in your directory. You should send them an invitation first. The contents WILL NOT BE SECURE';},20);
	}else{
		encryptButtons.style.display = '';
		inviteBtn.innerHTML = 'Chat';	
		inviteBtn.title = 'make a chat invitation for these recipients';	
	}
}
  
function showKeyDialog(isInit){
	var modal;
	if (!keyCreated){
		modal = $(keyHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#suggestKeyBtn').click(suggestKey);
		modal.find('#showKey').click(showSec);
		modal.find('#acceptKeyBtn').click(acceptKey);
		modal.find('#pwd').keyup(function(){pwdKeyup(event)});
  
		keyCreated = true;
	}else{
		modal = $(".passlok-key");
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")){
		if(isInit){
			modal.dialog({width : 600, autoOpen: false})
		}else{
			modal.dialog({modal: true, width: 600, autoOpen: true});
			if(!myEmail) keyMsg.innerHTML = '<span style="color:red;">PassLok has not loaded properly. Please reload your email page</span>';
		}
	}
	pwd.type = 'password';
}

function showOldKeyDialog(isInit){
	var modal;
	if (!oldKeyCreated){
		modal = $(oldKeyHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#showOldKey').click(showOldSec);
		modal.find('#cancelOldKeyBtn').click(cancelOldKey);
		modal.find('#acceptOldKeyBtn').click(acceptOldKey);
		modal.find('#oldPwd').keyup(function(){oldPwdKeyup(event)});
  
		oldKeyCreated = true;
	}else{
		modal = $(".passlok-oldkey");
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")){
		if(isInit){
			modal.dialog({width : 600, autoOpen: false})
		}else{
			modal.dialog({modal: true, width: 600, autoOpen: true})
		}
	}
}

function showNameDialog(){
	var modal;
	if (!nameCreated){
		modal = $(nameHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#cancelNameBtn').click(cancelName);
		modal.find('#acceptNameBtn').click(storeNewLock);
  
		nameCreated = true;
	}else{
		modal = $(".passlok-name");
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")){
		modal.dialog({modal: true, width: 600, autoOpen: true})
	}
}

function showChatDialog(){
	var modal;
	if (!chatCreated){
		modal = $(chatHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#cancelChatBtn').click(cancelChat);
		modal.find('#makeChatBtn').click(makeChat);
  
		chatCreated = true;
	}else{
		modal = $(".passlok-chat");
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")){
		modal.dialog({modal:true, width: 600, autoOpen: true})
	}
	if(!myKey) showKeyDialog();
}

function showAcceptChatDialog(message){
	var modal;
	if (!acceptChatCreated){
		modal = $(acceptChatHTML);
  
	//event listeners; the functions are defined elsewhere
		modal.find('#cancelChat2Btn').click(cancelAcceptChat);
		modal.find('#acceptChatBtn').click(acceptChat);
  
		acceptChatCreated = true;
	}else{
		modal = $(".passlok-acceptchat");
	}
	if (!modal.dialog("instance") || !modal.dialog("isOpen")){
		modal.dialog({modal: true, width: 600, autoOpen: true});
		chatMsg.innerHTML = message
	}
}


//This animation strategy inspired by http://blog.streak.com/2012/11/how-to-detect-dom-changes-in-css.html
//based on http://davidwalsh.name/detect-node-insertion changes will depend on CSS as well.
var insertListener = function(event) {
	if (event.animationName == "composeInserted") {
		composeIntercept();
	}
};

document.addEventListener("animationstart", insertListener, false); // standard + firefox
document.addEventListener("webkitAnimationStart", insertListener, false);

//to detect the presence of a PassLok-encrypted message
function detectPassLok(element){
	var string = $(element).parents().eq(5).find('.a3s')[0].innerHTML;							//find body text
	string = string.split("gmail_extra")[0];														//don't include quoted emails
	string = string.replace(/[\s\n]/g,'').replace(/<(.*?)>/gi, "");								//remove spaces, newlines, and any html tags
	string = string.trim().split("==")[1]															//first stuff between double == signs
	if(string){
		return string.replace(/[a-zA-Z0-9+\/@#\$%]+/g,'').length == 0							//detect whether the whole thing is base64 plus type markers
	}else{
		return false
	}
}

//the rest is for integrating the code with some web mail servers. As of version 0.1 only Gmail is supported
var serviceName = 'gmail';							//not used yet, but will be once we add Yahoo, etc.

//to retrieve the user's own email address
function getMyEmail(){
	myEmail = document.title.split('-')[1].trim();				//from Gmail title
}

//detects Gmail compose or read areas and places buttons in them  
function composeIntercept(ev) {
	var composeBoxes = $('.n1tfz');
	if (composeBoxes && composeBoxes.length > 0){
		composeBoxes.each(function(){
			var composeMenu = $(this).parents().eq(2);
			if (composeMenu && composeMenu.length > 0 && composeMenu.find('.passlok').length === 0){
				var maxSizeCheck = composeMenu.parents().eq(4).find('[style*="max-height"]');
				var encryptionFormOptions = '<a href="#" class="passlok" data-title2="insert PassLok-encrypted text"><img src="'+chrome.extension.getURL("images/icon.png")+'" /></a>';
				composeMenu.find('.n1tfz :nth-child(6) :first').parent().after(encryptionFormOptions);

				$(this).find('.passlok').click(function(){						//activate the button
					var bodyDiv = $(this).parents().eq(11).find('.Am');
					bodyID = bodyDiv.attr('id');									//this global variable will be used to write the encrypted message
					var bodyText = bodyDiv.html();
					//PREVIOUS THREAD MESSAGES OPTIONAL
					var extraText = $(this).parents().eq(11).find('.gmail_extra').html();
					if(extraText) bodyText += extraText;
					var emails = $(this).parents().eq(12).find('.vN');
					var emailList = [];
					for(var i = 0; i < emails.length; i++){
						emailList.push(emails.get(i).attributes['email'].value)
					}
//					var subject = $(this).parents().eq(11).find('.aoT').val();
					showComposeDialog(emailList,bodyText);
//					if(!myKey) showKeyDialog();
				});	  
			};
		});
	}

//this part for reading messages
	var viewTitleBar = rootElement.find('td[class="gH acX"]');
	if (viewTitleBar && viewTitleBar.length > 0){
		viewTitleBar.each(function(v) {
			if ($(this).find('.passlok').length === 0){
			  if(detectPassLok(this)){
				$(this).prepend('<a href="#" class="passlok" data-title="decrypt with PassLok"><img src="'+chrome.extension.getURL("images/icon.png")+'" /></a>');
				
				$(this).find('.passlok').click(function(){
					var email = $(this).parents().eq(5).find('.iw')[0].firstChild.attributes['email'].value;
					var bodyText = $(this).parents().eq(5).find('.a3s')[0].innerHTML;
//					var subject = $(this).parents().eq(16).find('.hP').text();
					showReadDialog(email,bodyText);
					if(!myKey) showKeyDialog();
				});
			  }
			}
		});
	}
}