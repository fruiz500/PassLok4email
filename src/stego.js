//This function calls the Letters encoder
function textStego(text){
	if(text.match('==')) text = text.split('==')[1];
	text = text.replace(/<(.*?)>/gi,"");
	var	result = toLetters(text);
	coverBox.value = '';
	return result
}

//This function calls the Invisible encoder
function invisibleStego(text){
	if(text.match('==')) text = text.split('==')[1];
	text = text.replace(/<(.*?)>/gi,"");
	return toInvisible(text)
}

//just to enter the cover text
function enterCover(){
	if(typeof(coverBox) == 'undefined') {showCoverDialog(); throw('break for cover input')};
	if(coverBox.value.trim() == '') {showCoverDialog(); throw('break for cover input')};	
}

//makes the binary equivalent (array) of a base64 string. No error checking
function toBin(input){
	var output = new Array(input.length * 6),
		code = '';
	
    for(var i = 0; i < input.length; i++) {
		code = ("000000" + base64.indexOf(input.charAt(i)).toString(2)).slice(-6);
		for(var j = 0; j < 6; j++){
			output[6 * i + j] = parseInt(code.charAt(j))
		}
    }
	return output
}

//retrieves base64 string from binary array. No error checking
function fromBin(input){
	var length = input.length - (input.length % 6)
	var output = new Array(length / 6),
		codeArray = new Array(6);
	
	for(var i = 0; i < length; i = i+6) {
		codeArray = input.slice(i,i+6);
		for(var j = 0; j < 6; j++){
			codeArray[j] = input[i+j].toString()
		}
		output[i / 6] = base64.charAt(parseInt(codeArray.join(''),2))
    }
	return output.join('')
}

//returns true if pure base64
function isBase64(string){
	return !string.match(/[^a-zA-Z0-9+\/]/)
}

//Letters encoding is based on code at: http://www.irongeek.com/i.php?page=security/unicode-steganography-homoglyph-encoder, by Adrian Crenshaw, 2013
//first the object containing the Unicode character substitutions
var charMappings = {//Aa
					"a":"0", "a0":"a", "\u0430":"1", "a1":"\u0430",
					"A":"0", "A0":"A", "\u0391":"1", "A1":"\u0391",
					//Bb
					"B":"0", "B0":"B", "\u0392":"1", "B1":"\u0392",
					//Cc
					"c":"0", "c0":"c", "\u0441":"1", "c1":"\u0441",
					"C":"0", "C0":"C", "\u0421":"1", "C1":"\u0421",
					//Ee
					"e":"0", "e0":"e", "\u0435":"1", "e1":"\u0435",
					"E":"0", "E0":"E", "\u0415":"1", "E1":"\u0415",
					//Gg
					"g":"0", "g0":"g", "\u0261":"1", "g1":"\u0261",
					//Hh
					"H":"0", "H0":"H", "\u041D":"1", "H1":"\u041D",
					//Ii
					"i":"0", "i0":"i", "\u0456":"1", "i1":"\u0456",
					"I":"0", "I0":"I", "\u0406":"1", "I1":"\u0406",
					//Jj
					"j":"0", "j0":"j", "\u03F3":"1", "j1":"\u03F3",
					"J":"0", "J0":"J", "\u0408":"1", "J1":"\u0408",
					//Kk
					"K":"0", "K0":"K", "\u039A":"1", "K1":"\u039A",
					//Mm
					"M":"0", "M0":"M", "\u039C":"1", "M1":"\u039C",
					//Nn
					"N":"0", "N0":"N", "\u039D":"1", "N1":"\u039D",
					//Oo
					"o":"0", "o0":"o", "\u03BF":"1", "o1":"\u03BF",
					"O":"0", "O0":"O", "\u039F":"1", "O1":"\u039F",
					//Pp
					"p":"0", "p0":"p", "\u0440":"1", "p1":"\u0440",
					"P":"0", "P0":"P", "\u03A1":"1", "P1":"\u03A1",
					//Ss
					"s":"0", "s0":"s", "\u0455":"1", "s1":"\u0455",
					"S":"0", "S0":"S", "\u0405":"1", "S1":"\u0405",
					//Tt
					"T":"0", "T0":"T", "\u03A4":"1", "T1":"\u03A4",
					//Xx
					"x":"0", "x0":"x", "\u0445":"1", "x1":"\u0445",
					"X":"0", "X0":"X", "\u03A7":"1", "X1":"\u03A7",
					//Yy
					"y":"0", "y0":"y", "\u0443":"1", "y1":"\u0443",
					"Y":"0", "Y0":"Y", "\u03A5":"1", "Y1":"\u03A5",
					//Zz
					"Z":"0", "Z0":"Z", "\u0396":"1", "Z1":"\u0396",
					//Spaces
					" ":"000",
					" 000":" ",
					"\u2004":"001",
					" 001":"\u2004",
					"\u2005":"010",
					" 010":"\u2005",
					"\u2006":"011",
					" 011":"\u2006",
					"\u2008":"100",
					" 100":"\u2008",
					"\u2009":"101",
					" 101":"\u2009",
					"\u202f":"110",
					" 110":"\u202F",
					"\u205F":"111",
					" 111":"\u205F"
					};

//counts the number of encodable bits in the cover text
function encodableBits(cover){
	var bitcount = 0;
	for (var i = 0; i < cover.length; i++){
		if (charMappings[cover[i]] !== undefined){
			bitcount = bitcount + charMappings[cover[i]].length;
		}
	}
	return bitcount
}

//encodes text as special letters and spaces in the cover text, which replace the original ones
function toLetters(text){
	var textBin = toBin(text).join(''),				//string containing 1's and 0's
		coverText = addSpaces(coverBox.value.trim().replace(/[\n\s-]+/g,' ')),
		cover = coverText,
		capacity = encodableBits(cover);
	if (capacity < textBin.length){						//repeat the cover text if it's too short
		var turns = Math.ceil(textBin.length / capacity),
			index = 0;
		while (index < turns){
			cover += ' ' + coverText;
			index++
		}
	}
	var finalString = "",
		bitsIndex = 0,
		i = 0,
		doneBits = '';
	while(doneBits.length < textBin.length){
		if (charMappings[cover[i]] === undefined){
			finalString = finalString + cover[i]
		}else{
			var tempBits = textBin.substring(bitsIndex,bitsIndex + charMappings[cover[i]].length);
			while(tempBits.length < charMappings[cover[i]].length){tempBits = tempBits + "0";} 			//Got to pad it out
			finalString += charMappings[cover[i] + tempBits];
			bitsIndex += charMappings[cover[i]].length;
			doneBits += tempBits
		}
		i++
	}
	return finalString + '.'								//period needed because there could be spaces at the end
}

//gets the original text from Letters encoded text
function fromLetters(text){
	var bintemp = [],
		tempchar = "";
	for (var i = 0; i < text.length; i++){
		if (charMappings[text[i]] === undefined ){
		}else{
			tempchar = charMappings[text[i]];
			bintemp.push(tempchar)
		}
	}
	var binStr = bintemp.join(''),
		bin = new Array(binStr.length);
	for(var i = 0; i < binStr.length; i++) bin[i] = parseInt(binStr.charAt(i));
	text2decrypt = fromBin(bin.slice(0,bin.length-(bin.length % 6)))
}

//the following functions are to hide text between two letters, as a binary string made of invisible characters.
function toInvisible(text) {
	return invisibleEncoder(toBin(text))
}

function fromInvisible(text) {
	text2decrypt = fromBin(invisibleDecoder(text))
}

function invisibleEncoder(bin){
	var stegospace = ['\u00ad', '\u200c'],
		newtext = new Array(bin.length);

	for(var i = 0; i < bin.length; i++){
		newtext[i+1] = stegospace[bin[i]]
	}
	return newtext.join('')													//text bracketing this is added right after the call
}

function invisibleDecoder(text){
	var binStr = text.replace(/\u00ad/g,'0').replace(/\u200c/g,'1');
	binStr = binStr.match(/[a-zA-Z,:\.][01]+[a-zA-Z]/)[0].slice(1,-1);						//remove text around the binary part
	var length = binStr.length,
		bin = new Array(length);
	for(var i = 0; i < length; i++){
		if (binStr.charAt(i) == '0'){
			bin[i] = 0
		}else{
			bin[i] = 1
		}
	}
	return bin
}

//adds spaces that can be encoded if Chinese, Korean, or Japanese
function addSpaces(string){
	if (string.match(/[\u3400-\u9FBF]/) != null) string = string.split('').join(' ').replace(/\s+/g, ' ');
	return string
}

//now the code for image steganography, closely related to that available at https://github.com/fruiz500/passlok-stego

//show how much text can be hidden in the image
function updateCapacity(){
  if(decodeImgBtn.style.display == 'none'){						//do this calculation only when encoding, not when decoding
	var	textsize = composeBox.textContent.length;

	stegoImageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																				//give it 2 seconds to complete
		if(stegoImageMsg.textContent == 'PROCESSING') stegoImageMsg.textContent = 'There was an error calculating the capacity, but the image is still usable'
	},2000)

  setTimeout(function(){
	 //start measuring png capacity. Subtract 4 bits used to encode k, 48 for the end marker
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = document.getElementById('previewImg').naturalWidth;
	shadowCanvas.height = document.getElementById('previewImg').naturalHeight;
	shadowCtx.drawImage(document.getElementById('previewImg'), 0, 0, shadowCanvas.width, shadowCanvas.height);
	
	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		opaquePixels = 0;
	for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
		if(imageData.data[i] == 255) opaquePixels++					//use pixels with full opacity only
	}
	var pngChars = Math.floor((opaquePixels * 3 - 270) / 6); 
	  
	//now measure jpeg capacity
	if(document.getElementById('previewImg').src.slice(11,15) == 'jpeg'){					//true jpeg capacity calculation,
		var lumaCoefficients = [],
			count = 0;
		jsSteg.getCoefficients(document.getElementById('previewImg').src, function(coefficients){
			var subSampling = 1;
			for(var index = 1; index <= 3; index++){						//first luma, then chroma channels, index 0 is always empty
				lumaCoefficients = coefficients[index];
				if(lumaCoefficients){
					if(index != 1) subSampling = Math.floor(coefficients[1].length / lumaCoefficients.length);
	 	 			for (var i = 0; i < lumaCoefficients.length; i++) {
						for (var j = 0; j < 64; j++) {
							if(lumaCoefficients[i][j] != 0) count += subSampling		//if subsampled, multiply the count since it won't be upon re-encoding
   	 					}
					}
					if(index == 1) var firstCount = count
				}else{
					count += firstCount													//repeat count if the channel appears not to exist (bug in js-steg)
				}
			}
			var jpgChars = Math.floor((count - 270) / 6);			//base64 version, 4 bits used to encode k, 48 for the end marker, 270 buffer for second message

			stegoImageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, ' + jpgChars + ' as JPG. We have ' + textsize + ' characters'
		})
	}else{															//no jpeg, so estimate capacity
		var jpgChars = Math.floor(pngChars / 20);		//base64 version

		stegoImageMsg.textContent = 'This image can hide ' + pngChars + ' characters as PNG, at least ' + jpgChars + ' as JPG. We have ' + textsize + ' characters'
	}
  },30)					//end of timeout

  }else{
	stegoImageMsg.textContent = 'Now type in the Password, if any, and click Decrypt'
  }
}

//put text into image, which turns into PNG
function encodePNG(){
	var text = composeBox.textContent.trim().replace(/\s/g,'');
	if(text.match('==')) text = text.split('==')[1].replace(/<(.*?)>/gi,"");

	//bail out if no data
	if(!text){
		stegoImageMsg.textContent = 'There is nothing to hide';
		throw("box empty of content")
	}
	if(previewImg.src.length < 100){											//no image loaded
		stegoImageMsg.textContent = 'Please load an image before clicking this button';
		throw("no image loaded")
	}
	
	stegoImageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started

	var resultURI = encodePNGprocess(text);					//this is the main process, in next functions

	previewImg.src = resultURI;													//put result into page so it can be saved
	previewImg.onload = function(){
		stegoImageMsg.textContent = 'Message encrypted into the image. Save it with right-click, then exit the dialog and attach it to email'
	}
}

var imgEOF = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
//this function does the PNG encoding as LSB in all channels except alpha, which is kept with original values
function encodePNGprocess(text){
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = previewImg.naturalWidth;
	shadowCanvas.height = previewImg.naturalHeight;
	shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);
	
	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),			//get the image data
		indexBin = 0,
		length = imageData.data.length,
		alphaData = new Array(length / 4);

	allCoefficients = new Array(length / 4 * 3);				//global variable, initialized below
	
	//separate alpha channel
	var k = 0;														//counter for actual data used
	for(var i = 3; i < length; i += 4){
		alphaData[Math.floor(i / 4)] = imageData.data[i]				//contains the alpha channel data, which will be needed later
		if(imageData.data[i] == 255){
			for(var j = 0; j < 3; j++){
				allCoefficients[k] = imageData.data[i - 3 + j];		//use data for opaque pixels only
				k++
			}
		}
	}
	allCoefficients = allCoefficients.slice(0,k);			//cut off the space that wasn't used
	
	//now turn the base64 text into a binary array
	var msgBin = toBin(text).concat(imgEOF),							//also replace special characters with base64 and add 48-bit end marker
		pwdArray = imagePwd.value.trim().replace(/\n/g,' ').split('|'),
		seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), length.toString() + 'png'));
	if(pwdArray.length == 3){
		var pwd2 = pwdArray[1].trim(), 
			msgBin2 = toBin(LZString.compressToBase64(pwdArray[2].trim())).concat(imgEOF);						//for when there is a second message
	}
	
	shuffleCoefficients(seed,0);																					//scramble image data to unpredictable locations

	var lastIndex = encodeToCoefficients('png',msgBin,0);
	
	if(msgBin2){													//this is done only if there is a second message, to be added immediately after the main message
		msgBin2 = msgBin2.concat(imgEOF);

		var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, lastIndex.toString() + 'png'));  			//using Wisehash rather than built-in
		
		shuffleCoefficients(seed2,lastIndex + 1);							//shuffle only beyond the last index used

		encodeToCoefficients('png', msgBin2, lastIndex + 1);
		
		unShuffleCoefficients(lastIndex + 1);
		lastIndex = 0
	}

	unShuffleCoefficients(0);																		//return image data to their right places

	//put result back into image
	k = 0;															//already defined as local
	for(var i = 3; i < length; i += 4){
		var alphaIndex = Math.floor(i / 4);
		if(alphaData[alphaIndex] == 255){
			for(var j = 0; j < 3; j++){
				imageData.data[i - 3 + j] = allCoefficients[k];					//RGB data
				k++
			}
		}
	}
	permutation = [];				//reset global variables
	permutation2 = [];
	allCoefficients = [];
	imagePwd.value = '';

	shadowCtx.putImageData(imageData, 0, 0);								//put in canvas so the dataURL can be produced
	return shadowCanvas.toDataURL()
}

//extract text from image
function decodeImage(){	
	stegoImageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	
  setTimeout(function(){
	if(previewImg.src.slice(11,15) == 'png;'){							//two cases: png and jpeg
		decodePNG()
	}else if(previewImg.src.slice(11,15) == 'jpeg'){
		decodeJPG()
	}
  },30)						//long timeout because decoding may take a while
}

//decodes data stored in PNG image
function decodePNG(){
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = previewImg.naturalWidth;
	shadowCanvas.height = previewImg.naturalHeight;
	shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);

	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		length = imageData.data.length;

	allCoefficients = new Array(length / 4 * 3);				//global variable
	
	//separate RGB data from alpha channel
	var k = 0;
	for(var i = 3; i < length; i += 4){
		if(imageData.data[i] == 255){										//use opaque pixels only
			for(var j = 0; j < 3; j++){
				allCoefficients[k] = imageData.data[i - 3 + j];
				k++
			}
		}
	}
	allCoefficients = allCoefficients.slice(0,k);

	var pwdArray = imagePwd.value.trim().replace(/\n/g,' ').split('|'),
		seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), length.toString() + 'png'));
	if(pwdArray.length == 2) var pwd2 = pwdArray[1].trim();										//for when there is a second message

	shuffleCoefficients(seed,0);														//scramble image data to unpredictable locations

	var result = decodeFromCoefficients('png',0);

	if(pwd2){													//extract hidden message if a second password is supplied
		var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, result[2].toString() + 'png'));	
		shuffleCoefficients(seed2,result[2] + 1);
		var result2 = decodeFromCoefficients('png',result[2] + 1)
	}
	
	permutation = [];
	permutation2 = [];
	allCoefficients = [];
	text2decrypt = fromBin(result[0]);													//send to global variable
	imagePwd.value = '';
	previewImg.src = '';
	$('#stegoImage').dialog("close");
	decryptList();
	openChat();
	if(result2){
		readMsg.innerHTML = 'Hidden message: <span style="color:blue">' + decryptSanitizer(LZString.decompressFromBase64(fromBin(result2[0]))) + '</span>'
	}
}

//this function gets the jpeg coefficients (first luma, then chroma) and extracts the hidden material. Stops when the 48-bit endText code is found
var allCoefficients, permutation;
var decodeJPG = function(){
	jsSteg.getCoefficients(previewImg.src, function(coefficients){
		var length = coefficients[1].length;
		if(coefficients[2].length != length){							//there's chrome subsampling, therefore it was not made by this process
			stegoImageMsg.textContent = 'This image does not contain anything, or perhaps the password is wrong';		//actually, just the former
			throw('image is chroma subsampled')
		}

		var	rawLength = 3*length*64,
			rawCoefficients = new Array(rawLength);

		for(var index = 1; index <= 3; index++){									//linearize the coefficients matrix into rawCoefficients
			for (var i = 0; i < length; i++) {
				for (var j = 0; j < 64; j++) {
					rawCoefficients[index*length*64 + i*64 + j] = coefficients[index][i][j]
				}
			}
		}	
		allCoefficients = removeZeros(rawCoefficients);									//get rid of zeros

		var pwdArray = imagePwd.value.trim().replace(/\n/g,' ').split('|'),
			seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), allCoefficients.length.toString() + 'jpeg'));
		if(pwdArray.length == 2) var pwd2 = pwdArray[1].trim();						//for when there is a second message

		shuffleCoefficients(seed,0);														//scramble image data to unpredictable locations

		var result = decodeFromCoefficients('jpeg',0);

		if(pwd2){													//extract hidden message if a second password is supplied
			var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, result[2].toString() + 'jpeg'));
			shuffleCoefficients(seed2,result[2] + 1);
			var result2 = decodeFromCoefficients('png',result[2] + 1)
		}

		permutation = [];
		permutation2 = [];
		allCoefficients = [];
		text2decrypt = fromBin(result[0]);													//send to global variable
		imagePwd.value = '';
		previewImg.src = '';
		$('#stegoImage').dialog("close");
		decryptList();
		openChat();
		if(result2){
			readMsg.innerHTML = 'Hidden message: <span style="color:blue">' + decryptSanitizer(LZString.decompressFromBase64(fromBin(result2[0]))) + '</span>'
		}
	})
}

//function to encode composeBox as coefficients in a jpeg image. Most of the work is done by modifyCoefficients, below
var encodeJPG = function(){
	var text = composeBox.textContent.trim().replace(/\s/g,'');
	if(text.match('==')) text = text.split('==')[1].replace(/<(.*?)>/gi,"");

	//bail out if no data
	if(!text){
		stegoImageMsg.textContent = 'There is nothing to hide';
		throw("box empty of content")
	}
	if(previewImg.src.length < 100){											//no image loaded
		stegoImageMsg.textContent = 'Please load an image before clicking this button';
		throw("no image loaded")
	}
	stegoImageMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	
  setTimeout(function(){																			//the rest after a 30 ms delay
	if(previewImg.src.slice(11,15).match(/gif;|png;/)) transparent2white();		//first remove transparency

	jsSteg.reEncodeWithModifications(previewImg.src, modifyCoefficients, function (resultURI) {
		previewImg.src = resultURI;
		previewImg.onload = function(){
			stegoImageMsg.textContent = 'Message encrypted into the image. Save it with right-click, then exit the dialog and attach it to email'
		}
  	})
  },30)						//end of timeout
}

/**
 * Called when encoding a JPEG
 * - coefficients: coefficients[0] is an array of luminosity blocks, coefficients[1] and
 *   coefficients[2] are arrays of chrominance blocks. Each block has 64 "modes"
 */
var modifyCoefficients = function(coefficients) {
	var text = composeBox.textContent.trim();
	if(text.match('==')) text = text.split('==')[1].replace(/<(.*?)>/gi,"");
	var msgBin = toBin(text).concat(imgEOF);			//also replace special characters with base64 and add 48-bit end marker
		
	var length = coefficients[0].length,
		rawLength = 3*length*64,
		rawCoefficients = new Array(rawLength);

	for(var index = 0; index < 3; index++){									//linearize the coefficients matrix into rawCoefficients
		for (var i = 0; i < length; i++) {
			for (var j = 0; j < 64; j++) {
				rawCoefficients[index*length*64 + i*64 + j] = coefficients[index][i][j]
			}
		}
	}
	allCoefficients = removeZeros(rawCoefficients);							//remove zeros and store in global variable

	var pwdArray = imagePwd.value.trim().replace(/\n/g,' ').split('|'),
		seed = nacl.util.encodeBase64(wiseHash(pwdArray[0].trim(), allCoefficients.length.toString() + 'jpeg'));
	if(pwdArray.length == 3){
		var pwd2 = pwdArray[1].trim(), 
			msgBin2 = toBin(LZString.compressToBase64(pwdArray[2].trim())).concat(imgEOF);						//for when there is a second message
	}

	shuffleCoefficients(seed,0);										//scramble image data to unpredictable locations
	
	var lastIndex = encodeToCoefficients('jpeg', msgBin, 0);						//encoding step
	
	if(msgBin2){													//this is done only if there is a second message, to be added immediately after the main message
		var seed2 = nacl.util.encodeBase64(wiseHash(pwd2, lastIndex.toString() + 'jpeg'));
		
		shuffleCoefficients(seed2,lastIndex + 1);							//shuffle only beyond the last index used

		encodeToCoefficients('jpeg', msgBin2, lastIndex + 1);
		
		unShuffleCoefficients(lastIndex + 1);
		lastIndex = 0
	}

	unShuffleCoefficients(0);							//get the coefficients back to their original places
	
	var j = 0;													//put the zeros back in their places
	for(var i = 0; i < rawLength; i++){
		if(rawCoefficients[i]){									//only non-zeros
			rawCoefficients[i] = allCoefficients[j];
			j++
		}
	}

	for(var index = 0; index < 3; index++){					//reshape coefficient array back to original form
		for (var i = 0; i < length; i++) {
			for (var j = 0; j < 64; j++) {
				coefficients[index][i][j] = rawCoefficients[index*length*64 + i*64 + j]
			}
		}
	}
	permutation = [];
	permutation2 = [];
	allCoefficients = [];
	imagePwd.value = ''
}

//calculates a random-walk permutation, as seeded by "seed" and shuffles the global array "allCoefficients" accordingly. "permutation" is also global
function shuffleCoefficients(seed,startIndex){
	isaac.seed(seed);		//re-seed the PRNG

	var	length = allCoefficients.length,
		permutedCoeffs = new Array(length);

	if(!startIndex){
		permutation = randPerm(length)		//pseudo-random but repeatable array containing values 0 to length-1
	}else{
		permutation2 = randPerm(length - startIndex)		//the PRNG should be re-initialized before this operation
	}

	if(!startIndex){
		for(var i = 0; i < length; i++){
			permutedCoeffs[i] = allCoefficients[permutation[i]]
		}
		for(var i = 0; i < length; i++){
			allCoefficients[i] = permutedCoeffs[i]
		}
	}else{
		for(var i = 0; i < length - startIndex; i++){
			permutedCoeffs[i] = allCoefficients[startIndex + permutation2[i]]
		}
		for(var i = 0; i < length - startIndex; i++){
			allCoefficients[startIndex + i] = permutedCoeffs[i]
		}
	}
}

//inverse of the previous function, assumes the data and permutation arrays are stored in global variables allCoefficients and permutation
function unShuffleCoefficients(startIndex){
	var	length = allCoefficients.length,
		permutedCoeffs = new Array(length),
		index;
	if(!startIndex){var inversePermutation = new Array(length)}else{var inversePermutation2 = new Array(length - startIndex)};

	if(!startIndex){
		for(var i = 0; i < length; i++){		//first make the inverse permutation array
			index = permutation[i];
			inversePermutation[index] = i
		}
	}else{
		for(var i = 0; i < length - startIndex; i++){	
			index = permutation2[i];
			inversePermutation2[index] = i
		}		
	}
	if(!startIndex){
		for(var i = 0; i < length; i++){
			permutedCoeffs[i] = allCoefficients[inversePermutation[i]]
		}
		for(var i = 0; i < length; i++){
			allCoefficients[i] = permutedCoeffs[i]
		}
	}else{
		for(var i = 0; i < length - startIndex; i++){
			permutedCoeffs[i] = allCoefficients[startIndex + inversePermutation2[i]]
		}
		for(var i = 0; i < length - startIndex; i++){
			allCoefficients[startIndex + i] = permutedCoeffs[i]
		}
	}
}

//obtain a random permutation using isaac re-seedable PRNG, for use in image steganography
function randPerm(n) {
  var result = new Array(n);
  result[0] = 0;

  for(var i = 1; i < n; ++i) {
    var idx = (isaac.random() * (i + 1)) | 0			//here is the call to the isaac PRNG library
    if(idx < i) {
      result[i] = result[idx]
    }
    result[idx] = i
  }
  return result
}

//convert binary array to decimal number
function binArray2dec(array){
	var length = array.length,
		output = 0,
		mult = 1;
	
	for(var i = 0; i < length; i++){
		output += array[length-1-i]*mult;
		mult = mult*2
	}
	return output
}

//to get the parity of a number. Positive: 0 if even, 1 if odd. Negative: 0 if odd, 1 if even. 0 is even
function stegParity(number){
	if(number >= 0){
		return number % 2
	}else{
		return -(number - 1) % 2
	}
}

//faster Boolean filter for array
function removeZeros(array){
	var length = array.length,
		nonZeros = 0;
	for(var i = 0; i < length; i++) if(array[i]) nonZeros++;
	
	var outArray = new Array(nonZeros),
		j = 0;
	
	for(var i = 0; i < length; i++){
		if(array[i]){
			outArray[j] = array[i];
			j++
		}		
	}
	return outArray
}

//gets counts in the DCT AC histogram: 2's plus -2, 3's plus -3, outputs array containing the counts
function partialHistogram(array){
	var output = [0,0],
		length = array.length;
	
	for(var j = 0; j < length; j++){
		for(var i = 2; i <= 3; i++){
			if(array[j] == i || array[j] == -i) output[i-2]++
		}
	}
	return output
}

//matrix encoding of allCoefficients with variable k, which is prepended to the message. Selectable for png or jpeg encoding.
function encodeToCoefficients(type,inputBin,startIndex){
	//first decide what value to use for k
	var length = (startIndex == 0) ? allCoefficients.length - 222 : allCoefficients.length - startIndex - 4,	//extra slack the first time to have room for a hidden message
		rate = inputBin.length / length,				//necessary embedding rate
		k = 2;
	if(inputBin.length > length){
		stegoImageMsg.textContent='This image can hide ' + (Math.floor(length/6) - 8).toString() + ' characters. But the main box has ' + (Math.floor(inputBin.length/6) - 8).toString() + ' characters';
		allCoefficients = [];
		permutation = [];
		permutation2 = [];
		imagePwd.value = '';
		throw('not enough hiding capacity')
	}
	while( k / (Math.pow(2,k) - 1) > rate) k++;
	k--;
	if(k > 16) k = 16;											//so it fits in 4 bits at the start
	var kCode = new Array(4);									//k in 4-bit binary form
	for(var j = 0; j < 4; j++) kCode[3-j] = (k-1 >> j) & 1;	//actually, encode k-1 (0 to 15)
	if(type == 'jpeg'){
		var count2to3 = partialHistogram(allCoefficients.slice(startIndex + 4)),		//calculate histogram-adjusting frequencies
			y = count2to3[1]/(count2to3[0] + count2to3[1]),
			ones = 0,															//surplus 1's and -1's
			minusones = 0;
	}

	//now encode k into allCoefficients
	if(type == 'jpeg'){												//jpeg embedding
		for(var i = 0; i < 4; i++){
			if(allCoefficients[startIndex + i] > 0){									//positive same as for png
				if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){			//even made odd by going down one
					allCoefficients[startIndex + i]--
				}else if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){		//odd made even by going down one, except if the value was 1, which is taken to -1
					if(allCoefficients[startIndex + i] != 1){ allCoefficients[startIndex + i]-- }else{ allCoefficients[startIndex + i] = -1}
				}
			}else{														//negative coefficients are encoded in reverse
				if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){		//"odd" made even by going up one
					allCoefficients[startIndex + i]++
				}else if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){			//"even" made odd by going up one, except if the value was -1, which is taken to 1
					if(allCoefficients[startIndex + i] != -1){ allCoefficients[startIndex + i]++ }else{ allCoefficients[startIndex + i] = 1}
				}
			}
		}
	}else{																//png embedding
		for(var i = 0; i < 4; i++){
			if(kCode[i] == 1 && stegParity(allCoefficients[startIndex + i]) == 0){					//even made odd by going up one
				allCoefficients[startIndex + i]++
			}else if(kCode[i] == 0 && stegParity(allCoefficients[startIndex + i]) != 0){				//odd made even by going down one
				allCoefficients[startIndex + i]--
			}
		}
	}	
	
	//encode the actual data
	var n = Math.pow(2,k) - 1,
		blocks = Math.ceil(inputBin.length / k);		//number of blocks that will be used
	
	var parityBlock = new Array(n),
		inputBlock = new Array(k),
		coverBlock = new Array(n),
		hash, inputNumber, outputNumber;						//decimal numbers
	while(inputBin.length % k) inputBin.push(0);				//pad msg with zeros so its length is a multiple of k

	for(var i = 0; i < blocks; i++){
		inputBlock = inputBin.slice(i*k, (i*k)+k);
		inputNumber = binArray2dec(inputBlock);						//convert the binary block to decimal
		coverBlock = allCoefficients.slice(startIndex + 4+i*n, startIndex + 4+(i*n)+n);		//first 4 were for encoding k
		for(var j = 0; j < n; j++) parityBlock[j] = stegParity(coverBlock[j]);		//get parity digit for each number
		
		hash = 0;
		for(var j = 1; j <= n; j++) hash = hash ^ (parityBlock[j-1]*j);		//hash-making step, as in F5, notice the xor operation
		outputNumber = inputNumber ^ hash;							//position in the cover block that needs to be flipped, if the position is 0 change none
		
		if(outputNumber){												//no change if the result is zero, but increment the counter anyway
			if(type == 'jpeg'){										//jpeg embedding
				if(coverBlock[outputNumber-1] > 0){			//positive, so change by going down (normally); if 1 or -1, switch to the other
					if(coverBlock[outputNumber-1] == 1){		//whether to go up or down determined by whether there are too few or too many 1's and -1's
						if(minusones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber] = -1; ones--; minusones++}else{allCoefficients[startIndex + 3+i*n+outputNumber] = 2; ones--}
					}else if(coverBlock[outputNumber-1] == 2){
						if(ones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber]--; ones++}else{allCoefficients[startIndex + 3+i*n+outputNumber]++}
					}else{
						if(Math.random() > y){allCoefficients[startIndex + 3+i*n+outputNumber]--}else{allCoefficients[startIndex + 3+i*n+outputNumber]++}
					}
				}else if(coverBlock[outputNumber-1] < 0){	//negative, so change by going up
					if(coverBlock[outputNumber-1] == -1){
						if(ones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber] = 1; minusones--; ones++}else{allCoefficients[startIndex + 3+i*n+outputNumber] = -2; minusones--}
					}else if(coverBlock[outputNumber-1] == -2){
						if(minusones <= 0){allCoefficients[startIndex + 3+i*n+outputNumber]++; minusones++}else{allCoefficients[startIndex + 3+i*n+outputNumber]--}
					}else{
						if(Math.random() > y){allCoefficients[startIndex + 3+i*n+outputNumber]++}else{allCoefficients[startIndex + 3+i*n+outputNumber]--}
					}
				}													//if the coefficient was a zero, there is no change and the counter does not advance, so we repeat			
			}else{														//png embedding
				if(coverBlock[outputNumber-1] % 2){					//odd made even by going down one
					allCoefficients[startIndex + 3+i*n+outputNumber]--
				}else{													//even made odd by going up one
					allCoefficients[startIndex + 3+i*n+outputNumber]++
				}
			}
		}
	}
	return startIndex + blocks * n + 3						//last index involved in the encoding
}

//matrix decode of allCoefficients, where k is extracted from the start of the message. Selectable for png or jpeg encoding.
function decodeFromCoefficients(type,startIndex){
	//first extract k
	var	length = (startIndex == 0) ? allCoefficients.length - 222 : allCoefficients.length - startIndex - 4,		//extra slack the first time
		kCode = new Array(4);										//contains k in 4-bit format
	for(var i = 0; i < 4; i++) kCode[i] = stegParity(allCoefficients[startIndex + i]);			//output is 1's and 0's
	var k = binArray2dec(kCode) + 1;
	
	//now decode the data
	var n = Math.pow(2,k) - 1,
		blocks = Math.floor(length / n);
	if(blocks == 0){										//cover does not contain even one block
		stegoImageMsg.textContent = 'This image does not contain anything, or perhaps the password is wrong';
		allCoefficients = [];
		permutation = [];
		permutation2 = [];
		imagePwd.value = '';
		throw('block size larger than available data')
	}
	
	var parityBlock = new Array(n),
		coverBlock = new Array(n),
		outputBin = new Array(k*blocks),
		hash;

	for(var i = 0; i < blocks; i++){
		coverBlock = allCoefficients.slice(startIndex + 4+i*n, startIndex + 4+(i*n)+n);
		for(var j = 0; j < n; j++) parityBlock[j] = stegParity(coverBlock[j]);		//0 if even, 1 if odd (reverse if negative, as in F5)
		
		hash = 0;
		for(var j = 1; j <= n; j++) hash = hash ^ (parityBlock[j-1]*j);		//hash-making step, as in F5, notice the xor operation
		for(var j = 0; j < k; j++) outputBin[i*k + k-1-j] = (hash >> j) & 1		//converts number to binary array and adds to output
	}

	var found = false,									//find the end marker after all the embedded bits are extracted, rather than after every block. This ends up being faster
		outLength = outputBin.length;
	for(var j = 0; j < outLength - 47; j++){
		found = true
		for(var l = 0; l < 48; l++){
			found = found && (imgEOF[47-l] == outputBin[outLength-l-j])
		}
		if(found){var fromEnd = j+47; break}
	}		
	if(!found){
		stegoImageMsg.textContent = 'The image does not contain anything, or perhaps the password is wrong';
		allCoefficients = [];
		permutation = [];
		imagePwd.value = '';
		throw('end marker not found')
	}
	outputBin = outputBin.slice(0,-fromEnd);
	var blocksUsed = Math.ceil((outputBin.length + 48) / k);
	return [outputBin,'Reveal successful',startIndex + blocksUsed * n + 3]								//clean up the end
}

//gets the histogram of an array, in this format: 0, 1, -1, 2, -2, ..., n, -n. Inputs are the array and n, output is the histogram. For testing purposes.
function getHistogram(array, n){
	var output = new Array(2*n + 2),
		length = array.length,
		counter1 = 0,
		counter2 = 0;
	
	for(var i = 0; i <= n; i++){
		counter1 = counter2 = 0;
		for(var j = 0; j < length; j++){
			if(array[j] == i) counter1++;
			if(array[j] == -i) counter2++
		}
		output[2*i] = counter1;
		output[2*i+1] = counter2
	}
	return output.slice(1)
}

//remove transparency and turn background white
function transparent2white(){
	var shadowCanvas = document.createElement('canvas'),
		shadowCtx = shadowCanvas.getContext('2d');
	shadowCanvas.style.display = 'none';

	shadowCanvas.width = previewImg.naturalWidth;
	shadowCanvas.height = previewImg.naturalHeight;
	shadowCtx.drawImage(previewImg, 0, 0, shadowCanvas.width, shadowCanvas.height);
	
	var imageData = shadowCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height),
		opaquePixels = 0;
	for(var i = 3; i < imageData.data.length; i += 4){				//look at alpha channel values
		if(imageData.data[i] == 0){
			for(var j = 0; j < 4; j++) imageData.data[i-j] = 255		//turn pure transparent to white
		}else{
			imageData.data[i] = 255									//if not pure transparent, turn opaque without changing color
		}
	}
	shadowCtx.putImageData(imageData, 0, 0);								//put in canvas so the dataURL can be produced
	previewImg.src = shadowCanvas.toDataURL()							//send to image element	
}