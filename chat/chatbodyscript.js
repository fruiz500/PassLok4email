                // Muaz Khan     - www.MuazKhan.com
                // MIT License   - www.WebRTC-Experiment.com/licence
                // Documentation - www.RTCMultiConnection.org
				  // with some changes by F. Ruiz
				
				var chatpwd = decodeURI(location.hash).slice(22);

                var connection = new RTCMultiConnection();

                connection.session = {
                    audio: true,
                    video: true
                };

                var roomsList = document.getElementById('rooms-list'), sessions = { };
                connection.onNewSession = function(session) {
                    if (sessions[session.sessionid]) return;
                    sessions[session.sessionid] = session;

                    var tr = document.createElement('tr');
						tr.innerHTML = 'The chat session has started. Write your name and then click the button to join. ' +						
						'<input type="text" id="user-name" placeholder="Write your name here">' +
                        '<button class="join" style="font-size:18px;">Join</button>';
                    roomsList.insertBefore(tr, roomsList.firstChild);
					
				document.getElementById('user-name').addEventListener('keyup', function(e) {
					var key = e.keyCode || e.which || e.keyChar;
					if (key == 13) tr.querySelector('.join').click();
				});
								
					document.getElementById('session-start').style.display = 'none';

                    tr.querySelector('.join').setAttribute('data-sessionid', session.sessionid)
                    tr.querySelector('.join').onclick = function() {
                        this.disabled = true;
						
						var username = document.getElementById('user-name').value.trim();
						if (username != '') connection.userid = username;
						
                        session = sessions[this.getAttribute('data-sessionid')];
                        if (!session) alert('No room to join.');

							connection.extra.password = chatpwd;
                        connection.join(session);
                    };
                };

                var videosContainer = document.getElementById('videos-container') || document.body;
                connection.onstream = function(e) {
                    var buttons = ['mute-audio', 'mute-video', 'record-audio', 'record-video', 'full-screen', 'volume-slider', 'stop'];

                    if (connection.session.audio && !connection.session.video) {
                        buttons = ['mute-audio', 'full-screen', 'stop'];
                    }

                    var mediaElement = getMediaElement(e.mediaElement, {
                        width: (videosContainer.clientWidth / 2) - 50,
                        title: e.userid,
                        buttons: buttons,
                        onMuted: function(type) {
                            connection.streams[e.streamid].mute({
                                audio: type == 'audio',
                                video: type == 'video'
                            });
                        },
                        onUnMuted: function(type) {
                            connection.streams[e.streamid].unmute({
                                audio: type == 'audio',
                                video: type == 'video'
                            });
                        },
                        onRecordingStarted: function(type) {
                            // www.RTCMultiConnection.org/docs/startRecording/
                            connection.streams[e.streamid].startRecording({
                                audio: type == 'audio',
                                video: type == 'video'
                            });
                        },
                        onRecordingStopped: function(type) {
                            // www.RTCMultiConnection.org/docs/stopRecording/
                            connection.streams[e.streamid].stopRecording(function(blob) {
                                if (blob.audio) connection.saveToDisk(blob.audio);
                                else if (blob.video) connection.saveToDisk(blob.video);
                                else connection.saveToDisk(blob);
                            }, type);
                        },
                        onStopped: function() {
                            connection.peers[e.userid].drop();
                        }
                    });

                    videosContainer.insertBefore(mediaElement, videosContainer.firstChild);

                    if (e.type == 'local') {
                        mediaElement.media.muted = true;
                        mediaElement.media.volume = 0;
                    }
                };
				
				  connection.onstreamended = function(e) {
                    e.mediaElement.style.opacity = 0;
//                    rotateVideo(e.mediaElement);
                    setTimeout(function() {
                        if (e.mediaElement.parentNode) {
                            e.mediaElement.parentNode.removeChild(e.mediaElement);
                        }
                        scaleVideos();
                    }, 0);
                };

                var setupNewSession = document.getElementById('setup-new-session');
				var _session = 'data';					//this is the default type

                setupNewSession.onclick = function() {
                    setupNewSession.disabled = true;

					  var direction = 'many-to-many';
//                    var _session is assigned from first character in the URL
                    var splittedSession = _session.split('+');

                    var session = { };
                    for (var i = 0; i < splittedSession.length; i++) {
                        session[splittedSession[i]] = true;
                    }

                    var maxParticipantsAllowed = 256;

                    if (direction == 'one-to-one') maxParticipantsAllowed = 1;
                    if (direction == 'one-to-many') session.broadcast = true;
                    if (direction == 'one-way') session.oneway = true;

					var sessionName = Math.floor(Math.random()*10000000000000000);
                    connection.extra = {
                        'session-name': sessionName || 'Anonymous'
                    };

                    connection.session = session;
                    connection.maxParticipantsAllowed = maxParticipantsAllowed;

					connection.userid = document.getElementById('user-name-start').value;
                    connection.sessionid = sessionName || 'Anonymous';
						connection.extra.password = chatpwd;
                    connection.open();
					document.getElementById('session-start').style.display='none';
					appendDIV('Chat started and waiting for others to join');
                };

                connection.onmessage = function(e) {
                    appendDIV('<span style="color:brown">' + e.userid +':  </span>' + e.data);

                    console.debug(e.userid, 'posted', e.data);
                    console.log('latency:', e.latency, 'ms');
					  document.getElementById('ding').play()
                };

                connection.onclose = function(e) {
                    appendDIV('connection closed for ' + e.userid);
					showPeers();
					document.getElementById('ding').play()
                };

                connection.onleave = function(e) {
                    appendDIV(e.userid + ' left the chat');
					showPeers();
					document.getElementById('ding').play()
                };

                // on data connection gets open
                connection.onopen = function(e) {
                    if (document.getElementById('chat-input')) document.getElementById('chat-input').disabled = false;
                    if (document.getElementById('file')) document.getElementById('file').disabled = false;
                    if (document.getElementById('open-new-session')) document.getElementById('open-new-session').disabled = true;
					appendDIV('connected to ' + e.userid);
					document.getElementById('rooms-list').style.display='none';
					showPeers();
					document.getElementById('ding').play()
                };

                var progressHelper = { };

                connection.autoSaveToDisk = false;

                connection.onFileProgress = function(chunk) {
                    var helper = progressHelper[chunk.uuid];
                    helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
                    updateLabel(helper.progress, helper.label);
                };
                connection.onFileStart = function(file) {
                    var div = document.createElement('div');
                    div.title = file.name;
                    div.innerHTML = '<label>0%</label> <progress></progress>';
                    appendDIV(div, fileProgress);
                    progressHelper[file.uuid] = {
                        div: div,
                        progress: div.querySelector('progress'),
                        label: div.querySelector('label')
                    };
                    progressHelper[file.uuid].progress.max = file.maxChunks;
                };

                connection.onFileEnd = function(file) {
                    progressHelper[file.uuid].div.innerHTML = '<a href="' + file.url + '" target="_blank" download="' + file.name + '">' + file.name + '</a>';
					document.getElementById('ding').play()
                };

                function updateLabel(progress, label) {
                    if (progress.position == -1) return;
                    var position = +progress.position.toFixed(2).split('.')[1] || 100;
                    label.innerHTML = position + '%';
                }

                function appendDIV(div, parent) {
                    if (typeof div === 'string') {
                        var content = div;
                        div = document.createElement('div');
                        div.innerHTML = content;
                    }

                    if (!parent) chatOutput.insertBefore(div, chatOutput.firstChild);
                    else fileProgress.insertBefore(div, fileProgress.firstChild);

                    div.tabIndex = 0;
                }

                document.getElementById('file').onchange = function() {
                    connection.send(this.files[0]);
                };

                var chatOutput = document.getElementById('chat-output'),
                    fileProgress = document.getElementById('file-progress');

                var chatInput = document.getElementById('chat-input');
                chatInput.onkeypress = function(e) {
                    if (e.keyCode !== 13 || !this.value) return;
                    appendDIV('<span style="color:green">--Me: </span>' + this.value);

                    // sending text message
                    connection.send(this.value);

                    this.value = '';
                };
				
				document.getElementById('user-name-start').addEventListener('keyup', function(e) {
					if (e.keyCode == 13) document.getElementById('setup-new-session').click();
				});
				
                connection.connect();

                function scaleVideos() {
                    var videos = document.querySelectorAll('video'),
                        length = videos.length, video;

                    var minus = 130;
                    var windowHeight = 700;
                    var windowWidth = 600;
                    var windowAspectRatio = windowWidth / windowHeight;
                    var videoAspectRatio = 4 / 3;
                    var blockAspectRatio;
                    var tempVideoWidth = 0;
                    var maxVideoWidth = 0;

                    for (var i = length; i > 0; i--) {
                        blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
                        if (blockAspectRatio <= windowAspectRatio) {
                            tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
                        } else {
                            tempVideoWidth = windowWidth / i;
                        }
                        if (tempVideoWidth > maxVideoWidth)
                            maxVideoWidth = tempVideoWidth;
                    }
                    for (var i = 0; i < length; i++) {
                        video = videos[i];
                        if (video)
                            video.width = maxVideoWidth - minus;
                    }
                }
				
				connection.onRequest = function (userid, extra) {
    				// validating password in "onRequest"
    				if (userid.extra.password != connection.extra.password){
        				connection.reject(userid, extra);
						return alert('Someone has tried to join without the correct password');
					}
    				connection.accept(userid, extra);
				};

                window.onresize = scaleVideos;

//displays a list of participants
function showPeers(){
	var peerList = '';
	for (var id in connection.peers){
		if(connection.peers[id].userid){
			peerList = peerList + ': ' + connection.peers[id].userid;
		}
	}
	document.getElementById('chatmsg').innerHTML = chatmsgStart + '<span style="color:brown">' + peerList + '</span>'
}

var chatmsgStart = '';

//gets chat type and kicks out those whose URL does not conform
window.onload = function() {
	var myURL = decodeURI(location.hash);
	if (!myURL.match('#') || myURL.length != 65) {
		document.getElementById('session-start').innerHTML = '<span style="color:red">This page runs only from a PassLok chat invitation</span>';
		throw('attempted to run without referral')
	}
	var type = myURL.charAt(1);
	if (type == 'A'){
		_session = 'data';
		chatmsgStart = 'Text and file chat'
	}else if (type == 'B'){
		_session = 'audio+data';
		chatmsgStart = 'Audio, text and file chat'
	}else if (type == 'C'){
		_session = 'audio+video+data';
		chatmsgStart = 'Video, text and file chat'
	}else{
		document.getElementById('session-start').innerHTML = '<span style="color:red">This page runs only from a PassLok chat invitation</span>';
		throw('illegal chat type')
	}
	document.getElementById('chatmsg').innerHTML = chatmsgStart + '<span style="color:red">  Names chosen by the participants will appear here as they join. Since the chat session is not totally secure, you should authenticate each one before proceeding. When you are done with the chat, reload PassLok.</span>';
									
}