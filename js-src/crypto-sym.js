//symmetric encryption process, adapted from URSA
function symmetricEncrypt(text,isFileOut,isImageOut){
	if(!sharedPwd){											//open shared password input if there's no password in memory
		symmetricMsg.textContent = 'Enter the shared Password';
		symmetricMsg.style.color = '';
		openScreen('symmetricScr');
		return
	}
	if(sharedPwd.length*entropyPerChar > (composeBox.textContent.length + 64) * 8 && sharedPwd.length > 43){		//special mode for long keys, first cut
		padEncrypt(composeBox.textContent,isFileOut,isImageOut);
		return
	}else if(sharedPwd.split('~').length == 3){									//human mode: key is three strings separated by tildes: human-computable encryption
		humanEncrypt(composeBox.textContent,true,isFileOut,isImageOut);
		return
	}	
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		nonceStr = nacl.util.encodeBase64(nonce);

	var sharedKey = wiseHash(sharedPwd,nonceStr);		//use the nonce for stretching the user-supplied Key

	var cipher = symEncrypt(text,nonce24,sharedKey,true),		//true because compression is used
		outStr = nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'');
		
	finishEncrypt(outStr,isFileOut,isImageOut,false)
}

//symmetric decryption process
function symmetricDecrypt(cipherStr){
	if(!sharedPwd){														//open shared password input if there's no password in memory
		symmetricMsg.textContent = 'Enter the shared Password';
		symmetricMsg.style.color = '';
		openScreen('symmetricScr');
		return
	}

	if(cipherStr.charAt(0) == 'd' && sharedPwd.length > 43){ 					//special mode for long keys
		padDecrypt(cipherStr);
		sharedPwd = '';
		return
	}
	
	if(!cipherStr.match(/[^A-Z ]/)){													//only base26 plus maybe codegroup spacing: special human encrypted mode
		if(sharedPwd.split('~').length != 3){
			readMsg.textContent = 'Please supply a correct Key for human decryption: three strings separated by tildes';
			return
		}
		humanEncrypt(cipherStr,false,false,false);									//when set to false the process decrypts
		sharedPwd = '';
		return
	}

	var fullArray = nacl.util.decodeBase64(cipherStr);
	if(!fullArray) return false;
	var	nonce = fullArray.slice(1,10),
		nonce24 = makeNonce24(nonce),
		cipher = fullArray.slice(10);

	var sharedKey = wiseHash(sharedPwd,nacl.util.encodeBase64(nonce));				//real shared Key
	sharedPwd = '';

	var plain = symDecrypt(cipher,nonce24,sharedKey,true);			//if this fails, the function posts a generic message
	if(!plain){
		failedDecrypt('');
		openReadScreen();
		return
	}
	readBox.innerHTML = safeHTML(plain.trim());
	readMsg.textContent = 'shared Password decryption successful';
	openReadScreen();
	callKey = ''
}


//Now the Pad encryption mode

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8

//function for encrypting with long key
function padEncrypt(text,isFileOut,isImageOut){
	var keyText = sharedPwd,
		keyTextBin = nacl.util.decodeUTF8(keyText),
		clipped = false;

	var nonce = nacl.randomBytes(15);	
	if(text.match('="data:')){
		var textBin = nacl.util.decodeUTF8(text)
	}else{
		var textBin = LZString.compressToUint8Array(text)
	}

	var	keyLengthNeed = Math.ceil((textBin.length + 64) * 8 / entropyPerChar)
	
	if(keyLengthNeed > keyTextBin.length){
		composeMsg.textContent = "The key Text is too short";
		openScreen('composeScr');
		return
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}

	var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex),				//main encryption event
		macBin = padMac(textBin, keyTextBin, nonce, startIndex),						//make mac
		outStr = nacl.util.encodeBase64(concatUint8Arrays([116],concatUint8Arrays(nonce,concatUint8Arrays(macBin,cipherBin)))).replace(/=+$/,'');
	
	finishEncrypt(outStr,isFileOut,isImageOut,false)
}

//This is the core of pad encryption. Takes binary inputs and returns binary output. Same code for encrypt and decrypt
function padResult(textBin, keyTextBin, nonce, startIndex){
	var keyLength = Math.ceil(textBin.length * 8 / entropyPerChar);
	var keyBin = new Uint8Array(keyLength),
		i;
	if(startIndex + keyLength <= keyTextBin.length){								//fits without wrapping
		for(i = 0; i < keyLength; i++){
			keyBin[i] = keyTextBin[startIndex + i]
		}
	}else{																				//wrapping needed
		for(i = 0; i < keyTextBin.length - startIndex; i++){
			keyBin[i] = keyTextBin[startIndex + i]
		}
		for(i = 0; i < keyLength - (keyTextBin.length - startIndex); i++){
			keyBin[keyTextBin.length - startIndex + i] = keyTextBin[i]
		}
	}
	
	//now take a whole bunch of hashes of the encoded key Text, in 64-byte groups and using the nonce and an index, to make the keystream
	var count = Math.ceil(textBin.length / 64),
		keyStream = new Uint8Array(count * 64);	
	for(var index = 0; index < count; index++){
		var indexBin = nacl.util.decodeUTF8(index);
		var inputArray = new Uint8Array(keyBin.length + nonce.length + indexBin.length);

		//now concatenate the arrays
		for(i = 0; i < keyBin.length; i++){
			inputArray[i] = keyBin[i]
		}
		for(i = 0; i < nonce.length; i++){
			inputArray[keyBin.length + i] = nonce[i]
		}
		for(i = 0; i < indexBin.length; i++){
			inputArray[keyBin.length + nonce.length + i] = indexBin[i]
		}		
		var hash = nacl.hash(inputArray);			//now take the hash
		for(i = 0; i < 64; i++){
			keyStream[index*64 + i] = hash[i]
		}
	}
	
	//and finally XOR the keystream and the text
	var cipherBin = new Uint8Array(textBin.length);
	for(i = 0; i < textBin.length; i++){
		cipherBin[i] = textBin[i] ^ keyStream[i]
	}
	return cipherBin
}

//makes a 16-byte message authentication code
function padMac(textBin, keyTextBin, nonce, startIndex){						//startIndex is the one from the prompt
	var textKeyLength = Math.ceil(textBin.length * 8 / entropyPerChar),
		macKeyLength = Math.ceil(64 * 8 / entropyPerChar);						//collect enough entropy so the probability of a positive is the same for correct and incorrect decryptions
	var macBin = new Uint8Array(textBin.length + macKeyLength + nonce.length),
		i;
	var macStartIndex = (startIndex + textKeyLength) % keyTextBin.length		//mod because it may have wrapped
	
	//now add a sufficient part of the key text to obfuscate 9 bytes
	if(macStartIndex + macKeyLength <= keyTextBin.length){								//fits without wrapping
		for(i = 0; i < macKeyLength; i++){
			macBin[i] = keyTextBin[macStartIndex + i]
		}
	}else{																					//wrapping needed
		for(i = 0; i < keyTextBin.length - macStartIndex; i++){
			macBin[i] = keyTextBin[macStartIndex + i]
		}
		for(i = 0; i < macKeyLength - (keyTextBin.length - macStartIndex); i++){
			macBin[keyTextBin.length - macStartIndex + i] = keyTextBin[i]
		}
	}

	//now add the nonce
	for(i = 0; i < nonce.length; i++){
		macBin[macKeyLength + i] = nonce[i]
	}

	//finish adding the plaintext. The rest will be left as zeroes
	for(i = 0; i < textBin.length; i++){
		macBin[macKeyLength + nonce.length + i] = textBin[i]
	}

	//take the SHA512 hash and keep the first 16 bytes
	return nacl.hash(macBin).slice(0,16)
}

//for decrypting with long key
function padDecrypt(cipherStr){
	readMsg.textContent = "";
	var keyText = sharedPwd;

	try{
		var inputBin = nacl.util.decodeBase64(cipherStr);
		if(!inputBin) return false;
		var	keyTextBin = nacl.util.decodeUTF8(keyText);

		var	nonce = inputBin.slice(1,16),
			macBin = inputBin.slice(16,32),
			cipherBin = inputBin.slice(32)
			
	}catch(err){
		readMsg.textContent = "This is corrupt or not encrypted"
	}
	if(cipherBin.length > keyTextBin.length){
		readMsg.textContent = "The key Text is too short";
		return
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex);		//decryption instruction

	try{
		if(cipherStr.length == 160){
			var plain = decodeURI(nacl.util.encodeUTF8(plainBin)).trim()
		}else{
			if(plainBin.join().match(",61,34,100,97,116,97,58,")){					//this when the result is a file, which uses no compression
				var plain = nacl.util.encodeUTF8(plainBin)
			}else{
				var plain = LZString.decompressFromUint8Array(plainBin)			//use compression in the normal case
			}
		}
	}catch(err){
		readMsg.textContent = "Pad mode decryption has failed"
	}
	
	//so far so good. Now do MAC checking
	if(plain){
		var	macNew = padMac(plainBin, keyTextBin, nonce, startIndex),				//make mac of the result
			macChecks = true;
		for(var i = 0; i < 16; i++){
			macChecks = macChecks && (macBin[i] == macNew[i])
		}

		if(macChecks){																//check authentication and display result if passed
			readBox.innerHTML = safeHTML(plain.trim());
			readMsg.textContent = 'Pad mode decryption successful';
		}else{
			readMsg.textContent = 'Pad mode message authentication has failed';
		}
	}else{
		readMsg.textContent = "Pad mode decryption has failed";
		readBox.textContent = ' '
	}
	openReadScreen();
	callKey = ''
}

//Finally, Human encryption mode

var	base26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	
//makes the scrambled alphabet, starting from a string
function makeAlphabet(string){
	var result = '', alpha = "ZYXWVUTSRQPONMLKJIHGFEDCBA",
		stringLength = string.length;
	if(stringLength != 0){
		for(var i = 0; i < stringLength; i++){
			var letter = string.charAt(i);
			if(result.indexOf(letter) == -1){			//letter not picked yet
				result += letter;
				var reg = new RegExp(letter);
				alpha = alpha.replace(reg,'')
			}else{										//letter was picked, so take first letter before it in the alphabet that is still available
				var index = base26.indexOf(letter),
					alphaLength = alpha.length;
				for(var j = 0; j < alphaLength; j++){
					if(base26.indexOf(alpha.charAt(j)) < index){
						result += alpha.charAt(j);
						alpha = alpha.slice(0,j) + alpha.slice(j+1,alphaLength);
						break
					}else if(j == alphaLength - 1){
						result += alpha.charAt(0);
						alpha = alpha.slice(1)
					}
				}
			}
		}
		var base26B = result + alpha
	}else{
		var base26B = base26							//use straight alphabet if the key is empty
	}
	var base26Barray = new Array(26),
		base26Binverse = new Array(26);
	for(var i = 0; i < 26; i++){
		base26Barray[i] = base26.indexOf(base26B.charAt(i));
		base26Binverse[i] = base26B.indexOf(base26.charAt(i))
	}
	return [base26Barray,base26Binverse]
}

//to remove accents etc.
String.prototype.removeDiacritics = function() {
    var diacritics = [
        [/[\300-\306]/g, 'A'],
        [/[\340-\346]/g, 'a'],
        [/[\310-\313]/g, 'E'],
        [/[\350-\353]/g, 'e'],
        [/[\314-\317]/g, 'I'],
        [/[\354-\357]/g, 'i'],
        [/[\322-\330]/g, 'O'],
        [/[\362-\370]/g, 'o'],
        [/[\331-\334]/g, 'U'],
        [/[\371-\374]/g, 'u'],
        [/[\321]/g, 'N'],
        [/[\361]/g, 'n'],
        [/[\307]/g, 'C'],
        [/[\347]/g, 'c'],
		 [/[\337]/g, 'ss'],
    ];
    var s = this;
    for (var i = 0; i < diacritics.length; i++) {
        s = s.replace(diacritics[i][0], diacritics[i][1]);
    }
    return s;
}

//processes plaintext or ciphertext and does encryption (decryption if isEncrypt = false)
function humanEncrypt(text,isEncrypt,isFileOut,isImageOut){
	text = text.replace(/(<br>|<div>)/g,' ').replace(/<(.*?)>/g,'');																		//no tags allowed. pure text
	if(text.trim() == '') return;
	
	//text preparation. If encrypting, convert Qs into Ks and then spaces into Qs. Punctuation other than commas into QQ
	if(isEncrypt){
		text = text.replace(/[0-9]/g,function(match){return base26.charAt(match);}).trim();						//replace numbers with letters
		text = text.toUpperCase().removeDiacritics();																//remove accents and make upper case
		text = text.replace(/Q/g,'K').replace(/[.;:!?{}_()\[\]…—–―\-\s\n]/g,'Q').replace(/Q+$/,'')				//turn Q into K, spaces and punctuation into Q
	}
	text = text.replace(/[^A-Z]/g,'');																				//only base26 anyway

	var rawKeys = sharedPwd.split('~');
	for(var i = 0; i < 3; i++) rawKeys[i] = rawKeys[i].toUpperCase().removeDiacritics().replace(/[^A-Z]/g,'');	//remove accents, spaces, and all punctuation

	var	base26B1arrays = makeAlphabet(compressKey(rawKeys[0],25)),
		base26B2arrays = makeAlphabet(compressKey(rawKeys[1],25)),
		base26BArray1 = base26B1arrays[0],
		base26BArray2 = base26B2arrays[0],
		base26Binverse1 = base26B1arrays[1],
		base26Binverse2 = base26B2arrays[1],
		seed = rawKeys[2] ? rawKeys[2] : rawKeys[0];			//if seed is empty, use key 1

	var seedLength = seed.length;
	seedArray = new Array(seedLength);				//this is actually the seed mask
	for(var i = 0; i < seedLength; i++){
		seedArray[i] = base26.indexOf(seed.charAt(i))
	}

	var isGoodSeed = false,							//so it calculates at least once. No iteration when decrypting
		extendedText = text;							//initialize for decryption
  while(!isGoodSeed){
	var	rndSeedArray = new Array(seedLength);	
	if(isEncrypt){										//per-message random seed
		var	dummySeed = '',
			newIndex;
		for(var i = 0; i < seedLength; i++){
			newIndex = Math.floor(betterRandom()*26);	//avoid using Math.random() since this must be cryptographically secure
			rndSeedArray[i] = newIndex;					//this contains the random seed		
			dummySeed += base26.charAt(newIndex)
		}
		extendedText = dummySeed + text
	}		
		
	var	length = extendedText.length,
		textArray = new Array(length),
		cipherArray = new Array(length);

	//now fill row 1 with numbers representing letters; this will be a lot faster than doing string operations
	for(var i = 0; i < length; i++){
		textArray[i] = base26.indexOf(extendedText.charAt(i))
	}
	
	//if decrypting, extract the random seed
	if(!isEncrypt){
		for(var i = 0; i < seedLength; i++) rndSeedArray[i] = base26BArray2[(26 - base26Binverse1[textArray[i]] + seedArray[i]) % 26]
	}
	
	//main calculation. First make the keystream
	var stream = new Array(length);
	for(var i = 0; i < seedLength; i++){
		stream[i] = rndSeedArray[i]
	}
	for(var i = seedLength; i < length; i++){
		stream[i] = base26BArray1[(26 - base26Binverse2[stream[i-seedLength]] + stream[i-seedLength+1]) % 26]
	}
	
	//now test that the cipherstream obtained has sufficient quality, otherwise make another guess for the seed and repeat the process
	if(isEncrypt){
		var freqArray = frequencies(stream,26),											//first compute the frequency histogram
			chiNumber = chiSquared(stream,freqArray,26),									//single letter chi-squared. Must be smaller than 34.4
			corNumber = corrAtDistance(stream,freqArray,26,1);							//correlation chi-squared for consecutive letters. Must be smaller than 671
		
		isGoodSeed = (chiNumber < 34.4) && (corNumber < 671)							//this is the test for randomness of the keystream
	}else{
		isGoodSeed = true																	//automatic pass when decrypting
	}
  }																						//end of iteration for good seed
	
	stream = seedArray.concat(stream.slice(seedLength));											//replace random seed with original seed before the final operation

	//now combine the plaintext (ciphertext) and the keystream using the Tabula Prava, and convert back to letters
	for(var i = 0; i < length; i++) cipherArray[i] = isEncrypt ? base26.charAt(base26BArray1[(26 - base26Binverse2[textArray[i]] + stream[i]) % 26]) : base26.charAt(base26BArray2[(26 - base26Binverse1[textArray[i]] + stream[i]) % 26]);
	var cipherText = cipherArray.join('');

	if(!isEncrypt){
		cipherText = cipherText.slice(seedLength);										//remove dummy seed when decrypting
		cipherText = cipherText.replace(/QQ/g,'. ').replace(/Q/g,' ').replace(/KU([AEIO])/g,'QU$1')
		readBox.textContent = cipherText;
		readMsg.textContent = 'human mode decryption finished';
		openReadScreen();
		callKey = ''
	}else{
		finishEncrypt(cipherText,isFileOut,isImageOut,false)
	}
}

//alternative to Math.random based on nacl.randomBytes. Used to generate floating point numbers between 0 and 1. Uses 8 bytes as space, which is enough for double precision
function betterRandom(){
	var randomArray = nacl.randomBytes(8),
		integer = 0,
		maxInt = 18446744073709551616; 				//this is 256^8
	for(var i = 0; i < 8; i++) integer = integer * 256 + randomArray[i];
	return integer / maxInt
}

//makes a high-entropy base26 key of a given length from a piece of regular text
function compressKey(string,length){
	var indexArray = new Array(string.length),
		outputArray = new Array(length),
		rows = Math.ceil(string.length / length),
		outStr = '';
	
	for(var i = 0; i < string.length; i++) indexArray[i] = base26.indexOf(string.charAt(i));		//turn into index array

	for(var i = 0; i < length; i++){	
		if(indexArray[i] != undefined) outputArray[i] = indexArray[i];									//do serpentine operations so long as there is more key material
		for(var j = 1; j < rows; j++){
			if(indexArray[i + length * j] != undefined) outputArray[i] = (26 - outputArray[i] + indexArray[i + length * j]) % 26
		}
	}
	
	for(var i = 0; i < length; i++) if(outputArray[i] != undefined) outStr += base26.charAt(outputArray[i]);
	return outStr
}

//counts frequency for each digit in the given base. The input array contains numbers from 0 to base - 1
function frequencies(array,base){
	var length = array.length,
		freqArray = new Array(base).fill(0);
	for(var i = 0; i < length; i++) freqArray[array[i]]++;
	return freqArray
}

//chi-squared statistic of a array in a given base
function chiSquared(array,freqArray,base){
	var	result = 0,
		length = array.length,
		expected = length / base,
		operand;
	for(var i = 0; i < base; i++){
		operand = freqArray[i] - expected;
		result += (operand * operand) / expected
	}
	return result
}

//two-digit test of dependence at different distance, for a given base. Minimum distance is 1
function corrAtDistance(array,freqArray,base,distance){
	var	length = array.length,
		highIndex = length - distance,
		result = 0,
		operand,
		expected,
		freqTable = new Array(base);
	for(var i = 0; i < base; i++) freqTable[i] = new Array(base).fill(0);
	for(var k = 0; k < highIndex; k++){			//fill the table with data
		freqTable[array[k]][array[k + distance]]++
	}
	for(var i = 0; i < base; i++){					//each first character
		for(var j = 0; j < base; j++){				//each second character
			expected = freqArray[i] * freqArray[j] / length;		//expected P(xy) = P(x)*P(y)
			if(expected > 0){										//in case a letter does not appear at all
				operand = freqTable[i][j] - expected;
				result += (operand * operand) / expected
			}
		}
	}
	return result
}