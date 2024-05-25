import h from './helpers.js';
window.addEventListener( 'load', () => {
	function setCookie(cookieName, cookieValue, expirationDays, path = "/") {
		var d = new Date();
		d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=" + path;
	}
	function getCookie(cookieName) {
		var name = cookieName + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var cookieArray = decodedCookie.split(';');
		for(var i = 0; i < cookieArray.length; i++) {
			var cookie = cookieArray[i];
			while (cookie.charAt(0) == ' ') {
				cookie = cookie.substring(1);
			}
			if (cookie.indexOf(name) == 0) {
				return cookie.substring(name.length, cookie.length);
			}
		}
		return "";
	}
	const room = h.getQString( location.href, 'room' );
	const serial = h.getQString(location.href, 'uid');
	const identity = h.getQString(location.href, 'identity');
	let host = h.getQString(location.href, 'host');
	let button = document.querySelector('.strt_cls');
	setCookie('host', host, 1);
	button.addEventListener('click', () => {
		if(getCookie('auth') == 'creation_teacher') {
			var xhr = new XMLHttpRequest();
			let link = getCookie('link');
			let identity = getCookie('identity');
			let serial = getCookie('serial');
			let socketId = getCookie('socketId');
			link = encodeURI(link);
			let str = `http://localhost/kcp/check.php?type=set_uid&identity=${identity}&link=${link}&id=${serial}&host=${socketId}`;
			xhr.open('GET', str, true);
			xhr.send();
			document.getElementById('videos').id = 'host_videos';
		} else {
			document.getElementById('share-screen').remove();
		}
		document.getElementById('custom_modal').style.display = 'none';
		fulscrn.click();
		document.getElementById('toggle-mute').click();
	});
	if(serial && identity) {
		setCookie('auth', 'creation_teacher', 1);
	}
	if ( !room ) {
		document.querySelector( '#room-create' ).attributes.removeNamedItem( 'hidden' );
		button.style.display = 'none';
	}
	else {
		var pc = [];
		let socket = io( '/stream' );
		var socketId = '';
		var myStream = '';
		var screen = '';
		getAndSetUserStream();
		socket.on( 'connect', () => {
			socketId = socket.io.engine.id;
			setCookie('socketId', socketId);
			socket.emit( 'subscribe', {
				room: room,
				socketId: socketId
			} );
			socket.on( 'new user', ( data ) => {
				socket.emit( 'newUserStart', { to: data.socketId, sender: socketId } );
				pc.push( data.socketId );
				init( true, data.socketId );
			} );
			socket.on( 'newUserStart', ( data ) => {
				pc.push( data.sender );
				init( false, data.sender );
			} );
			socket.on( 'ice candidates', async ( data ) => {
				data.candidate ? await pc[data.sender].addIceCandidate( new RTCIceCandidate( data.candidate ) ) : '';
			} );
			socket.on( 'sdp', async ( data ) => {
				if ( data.description.type === 'offer' ) {
					data.description ? await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) ) : '';
					h.getUserFullMedia().then( async ( stream ) => {
						if ( !document.getElementById( 'local' ).srcObject ) {
							h.setLocalStream( stream );
						}
						myStream = stream;
						stream.getTracks().forEach( ( track ) => {
							pc[data.sender].addTrack( track, stream );
						} );
						let answer = await pc[data.sender].createAnswer();
						await pc[data.sender].setLocalDescription( answer );
						socket.emit( 'sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId } );
					} ).catch( ( e ) => {
						console.error( e );
					} );
				}
				else if ( data.description.type === 'answer' ) {
					await pc[data.sender].setRemoteDescription( new RTCSessionDescription( data.description ) );
				}
			} );
		} );
		function getAndSetUserStream() {
			h.getUserFullMedia().then( ( stream ) => {
				myStream = stream;
				h.setLocalStream( stream );
			} ).catch( ( e ) => {
				console.error( `stream error: ${ e }` );
			} );
		}
		function init( createOffer, partnerName ) {
			pc[partnerName] = new RTCPeerConnection( h.getIceServer() );
			
			if ( screen && screen.getTracks().length ) {
				screen.getTracks().forEach( ( track ) => {
					pc[partnerName].addTrack( track, screen );
				} );
			}
			else if ( myStream ) {
				myStream.getTracks().forEach( ( track ) => {
					pc[partnerName].addTrack( track, myStream );
				} );
			}
			else {
				h.getUserFullMedia().then( ( stream ) => {
					myStream = stream;
					stream.getTracks().forEach( ( track ) => {
						pc[partnerName].addTrack( track, stream );
					} );
					h.setLocalStream( stream );
				} ).catch( ( e ) => {
					console.error( `stream error: ${ e }` );
				} );
			}
			if ( createOffer ) {
				pc[partnerName].onnegotiationneeded = async () => {
					let offer = await pc[partnerName].createOffer();
					
					await pc[partnerName].setLocalDescription( offer );
					
					socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId } );
				};
			}
			pc[partnerName].onicecandidate = ( { candidate } ) => {
				socket.emit( 'ice candidates', { candidate: candidate, to: partnerName, sender: socketId } );
			};
			pc[partnerName].ontrack = ( e ) => {
				let str = e.streams[0];
				if ( document.getElementById( `${ partnerName }-video` ) ) {
					document.getElementById( `${ partnerName }-video` ).srcObject = str;
				}
				else {
					let newVid = document.createElement( 'video' );
					newVid.id = `${ partnerName }-video`;
					newVid.srcObject = str;
					newVid.autoplay = true;
					newVid.className = 'remote-video';
					let cardDiv = document.createElement( 'div' );
					cardDiv.className = 'video_remote';
					cardDiv.id = partnerName;
					cardDiv.appendChild( newVid );
					try {
						document.getElementById('videos').appendChild(cardDiv);
					}
					catch (err) {
						document.getElementById('host_videos').appendChild(cardDiv);
					}
				}
			};
			pc[partnerName].onconnectionstatechange = ( d ) => {
				switch ( pc[partnerName].iceConnectionState ) {
					case 'disconnected':
					case 'failed':
					h.closeVideo( partnerName );
					break;
					
					case 'closed':
					h.closeVideo( partnerName );
					break;
				}
			};
			pc[partnerName].onsignalingstatechange = ( d ) => {
				switch ( pc[partnerName].signalingState ) {
					case 'closed':
					console.log( "Signalling state is 'closed'" );
					h.closeVideo( partnerName );
					break;
				}
			};
		}
		function shareScreen() {
			h.shareScreen().then( ( stream ) => {
				screen = stream;
				broadcastNewTracks( stream, 'video', false );
				screen.getVideoTracks()[0].addEventListener( 'ended', () => {
					stopSharingScreen();
				} );
			} ).catch( ( e ) => {
				console.error( e );
			} );
		}
		function stopSharingScreen() {
			return new Promise( ( res, rej ) => {
				screen.getTracks().length ? screen.getTracks().forEach( track => track.stop() ) : '';
				res();
			} ).then( () => {
				h.toggleShareIcons( false );
				broadcastNewTracks( myStream, 'video' );
			} ).catch( ( e ) => {
				console.error( e );
			} );
		}
		function broadcastNewTracks( stream, type, mirrorMode = true ) {
			h.setLocalStream( stream, mirrorMode );
			let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
			for ( let p in pc ) {
				let pName = pc[p];
				
				if ( typeof pc[pName] == 'object' ) {
					h.replaceTrack( track, pc[pName] );
				}
			}
		}
		document.getElementById( 'toggle-mute' ).addEventListener( 'click', ( e ) => {
			e.preventDefault();
			let elem = document.getElementById( 'toggle-mute' );
			if ( myStream.getAudioTracks()[0].enabled ) {
				e.target.classList.replace('bi-mic-fill', 'bi-mic-mute-fill');
				elem.setAttribute( 'title', 'Unmute' );
				myStream.getAudioTracks()[0].enabled = false;
			}
			else {
				e.target.classList.replace('bi-mic-mute-fill', 'bi-mic-fill');
				elem.setAttribute( 'title', 'Mute' );
				myStream.getAudioTracks()[0].enabled = true;
			}
			broadcastNewTracks( myStream, 'audio' );
		} );
		let shareScrn = document.getElementById( 'share-screen' );
		shareScrn.addEventListener( 'click', ( e ) => {
			e.preventDefault();
			if ( screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended' ) {
				stopSharingScreen();
				shareScrn.classList.replace('bi-camera-video-fill', 'bi-easel2');
			}
			else {
				shareScreen();
				shareScrn.classList.replace('bi-easel2', 'bi-camera-video-fill');
			}
		} );
	}
} );