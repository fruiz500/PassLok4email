# PassLok4email
PassLok for Email is a Chrome and Firefox extension that adds PassLok encryption to webmail apps. Currently it supports Gmail, Yahoo, and Outlook online.

PassLok for Email is powerful, since it is based on NaCl (tweetNaCl JavaScript version, published here on GitHub), including the 256 bit XSalsa20 symmetric cipher and Curve25519 functions for asymmetric encryption. PassLok for Email also includes the WiseHash variable-strength key derivation algorithm so users are not restricted in their choice of private keys.

PassLok for Email is also designed to be very easy to use. The sender's Lock (public key) is added to every encrypted message, and retrieved automatically on the recipient's end so he/she does not need to bother with key management chores. The only key-management action requested of the user is entering his/her secret Password, from which the private key derives, when the encryption engine is initialized. The private key is retained in memory for five minutes beyond the last use of it and then deleted. It is never stored in any way.

The extensions published in the Chrome and Firefox stores are identical, except for the manifest.json file. These are renamed in this repo so you know which is which.

Authentication for the latest published version, which is 0.3.3:
This is the SHA256 of the .crx file obtained from the Chrome store, as described in the Help document: 987a75b398d092abb93e7d59fbbd448d230188035db0faad62b90757e64c7841
And this is the SHA256 of the .xpi file obtained from the Firefox store:
7d6b60d81722d4cb847ecd7185e87679ba2539494078a1a2f21045f273c6a967
