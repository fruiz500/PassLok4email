# PassLok4email
PassLok for Email is a Chrome and Firefox extension that adds PassLok encryption to webmail apps. Currently it supports Gmail, Yahoo, and Outlook online. It is distributed as an extension for Chrome and its derivatives at https://chrome.google.com/webstore/detail/passlok-for-email/ehakihemolfjgbbfhkbjgahppbhecclh and for Firefox at https://addons.mozilla.org/en-US/firefox/addon/passlok-for-email/

PassLok for Email is powerful, since it is based on NaCl (tweetNaCl JavaScript version, published here on GitHub), including the 256 bit XSalsa20 symmetric cipher and Curve25519 functions for asymmetric encryption. PassLok for Email also includes the WiseHash variable-strength key derivation algorithm so users are not restricted in their choice of private keys. It includes two main modes of encryption: Signed and Read-once (similar to Off-The-Record messaging, but for email), plus text steganography (concealed and Invisible modes) and image steganography (into PNG or JPG images). Encrypted data can be can be part of the email body or be in the attachments.

PassLok for Email is also designed to be very easy to use. The sender's Lock (public key) is added to every encrypted message, and retrieved automatically on the recipient's end so he/she does not need to bother with key management chores. The only key-management action requested of the user is entering his/her secret Password, from which the private key derives when the encryption engine is initialized. The private key is retained in memory for five minutes beyond the last use of it and then deleted. It is never stored in any way.

The extensions published in the Chrome and Firefox stores are identical, except for the manifest.json file. Those files are renamed in this repo so you know which is which.

Authentication for the latest version, which is 0.4.15:

This is the SHA256 of the .crx file obtained from the Chrome store, as described in the Help document: 
2aaa6de2f3af9828b66d197c05b1b40179c946af73273c90d64b5721803c5ac6

And this is the SHA256 of the .xpi file obtained from the Firefox store:
988a3810bbe57c531bc200608ac8bbbf4be1799c9ff7add28330592cc2717fca
