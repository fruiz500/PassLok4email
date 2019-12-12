//This function calls the Letters encoder
function textStego(text){
	if(text.match('==')) text = text.split('==')[1];
	text = text.replace(/<(.*?)>/gi,"").replace(/<br>/g,'').replace(/[\r\n]/g,'');
	var	result = toLetters(text);
	coverBox.value = '';
	return result
}

//This function calls the Invisible encoder
function invisibleStego(text){
	if(text.match('==')) text = text.split('==')[1];
	text = text.replace(/<(.*?)>/gi,"").replace(/<br>/g,'').replace(/[\r\n]/g,'');
	return toInvisible(text)
}

//just to enter the cover text
function enterCover(){
	if(typeof(coverBox) == 'undefined') {openScreen('coverScr'); return false};
	if(coverBox.value.trim() == '') {openScreen('coverScr'); return false};	
	return true
}

//retrieves base64 string from binary array. No error checking
function fromBin(input){
	var length = input.length - (input.length % 6),
		output = new Array(length / 6),
		index = 0;
	
	for(var i = 0; i < length; i = i+6) {
		index = 0;
		for(var j = 0; j < 6; j++){
			index = 2 * index + input[i+j]
		}
		output[i / 6] = base64.charAt(index)
    }
	return output.join('')
}

//makes the binary equivalent (array) of a base64 string. No error checking
function toBin(input){
	var output = new Array(input.length * 6),
		code = 0,
		digit = 0,
		divider = 32;
	
    for(var i = 0; i < input.length; i++) {
		code = base64.indexOf(input.charAt(i));
		divider = 32;
		for(var j = 0; j < 5; j++){
			digit = code >= divider ? 1 : 0;
			code -= digit * divider;
			divider = divider / 2;
			output[6 * i + j] = digit
		}
		output[6 * i + 5] = code;
    }
	return output
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
	binStr = binStr.match(/[01]+/)[0];									//keep binary part
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