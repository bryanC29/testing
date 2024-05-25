export default {
	generateRandomString() {
		const crypto = window.crypto || window.msCrypto;
		let array = new Uint32Array(1);
		return crypto.getRandomValues(array);
	},
	closeVideo( elemId ) {
		if ( document.getElementById( elemId ) ) {
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
			document.getElementById( elemId ).remove();
			if(getCookie('host') == elemId) {
				location.replace('http://127.0.0.1/kcp/ended.html');
			}
		}
	},
	pageHasFocus() {
		return !( document.hidden || document.onfocusout || window.onpagehide || window.onblur );
	},
	getQString( url = '', keyToReturn = '' ) {
		url = url ? url : location.href;
		let queryStrings = decodeURIComponent( url ).split( '#', 2 )[0].split( '?', 2 )[1];
		if ( queryStrings ) {
			let splittedQStrings = queryStrings.split( '&' );
			if ( splittedQStrings.length ) {
				let queryStringObj = {};
				splittedQStrings.forEach( function ( keyValuePair ) {
					let keyValue = keyValuePair.split( '=', 2 );
					if ( keyValue.length ) {
						queryStringObj[keyValue[0]] = keyValue[1];
					}
				} );
				return keyToReturn ? ( queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null ) : queryStringObj;
			}
			return null;
		}
		return null;
	},
	userMediaAvailable() {
		return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
	},
	getUserFullMedia() {
		if ( this.userMediaAvailable() ) {
			return navigator.mediaDevices.getUserMedia( {
				video: true,
				audio: {
					echoCancellation: true,
					noiseSuppression: true
				}
			} );
		}
		else {
			throw new Error( 'User media not available' );
		}
	},
	getUserAudio() {
		if ( this.userMediaAvailable() ) {
			return navigator.mediaDevices.getUserMedia( {
				audio: {
					echoCancellation: true,
					noiseSuppression: true
				}
			} );
		}
		else {
			throw new Error( 'User media not available' );
		}
	},
	shareScreen() {
		if ( this.userMediaAvailable() ) {
			return navigator.mediaDevices.getDisplayMedia( {
				video: {
					cursor: "always"
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 44100
				}
			} );
		}
		else {
			throw new Error( 'User media not available' );
		}
	},
	getIceServer() {
		return {
			iceServers: [
				{
					urls: ["stun:eu-turn4.xirsys.com"]
				},
				{
					username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
					credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
					urls: [
						"turn:eu-turn4.xirsys.com:80?transport=udp",
						"turn:eu-turn4.xirsys.com:3478?transport=tcp"
					]
				}
			]
		};
	},
	replaceTrack( stream, recipientPeer ) {
		let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind ) : false;
		sender ? sender.replaceTrack( stream ) : '';
	},
	toggleShareIcons( share ) {
		let shareIconElem = document.querySelector( '#share-screen' );
		if ( share ) {
			shareIconElem.setAttribute( 'title', 'Stop sharing screen' );
		}
		else {
			shareIconElem.setAttribute( 'title', 'Share screen' );
		}
	},
	singleStreamToggleMute( e ) {
		if ( e.target.classList.contains( 'fa-microphone' ) ) {
			e.target.parentElement.previousElementSibling.muted = true;
			e.target.classList.add( 'fa-microphone-slash' );
			e.target.classList.remove( 'fa-microphone' );
		}
		else {
			e.target.parentElement.previousElementSibling.muted = false;
			e.target.classList.add( 'fa-microphone' );
			e.target.classList.remove( 'fa-microphone-slash' );
		}
	},
	toggleModal( id, show ) {
		let el = document.getElementById( id );
		if ( show ) {
			el.style.display = 'block';
			el.removeAttribute( 'aria-hidden' );
		}
		else {
			el.style.display = 'none';
			el.setAttribute( 'aria-hidden', true );
		}
	},
	setLocalStream( stream, mirrorMode = true ) {
		const localVidElem = document.getElementById( 'local' );
		localVidElem.srcObject = stream;
		mirrorMode ? localVidElem.classList.add( 'mirror-mode' ) : localVidElem.classList.remove( 'mirror-mode' );
	},											
	createDemoRemotes( str, total = 6 ) {
		let i = 0;
		let testInterval = setInterval( () => {
			let newVid = document.createElement( 'video' );
			newVid.id = `demo-${ i }-video`;
			newVid.srcObject = str;
			newVid.autoplay = true;
			newVid.className = 'remote-video';
			let cardDiv = document.createElement( 'div' );
			cardDiv.className = 'card card-sm';
			cardDiv.id = `demo-${ i }`;
			cardDiv.appendChild( newVid );
			document.getElementById( 'videos' ).appendChild( cardDiv );
			i++;
			if ( i == total ) {
				clearInterval( testInterval );
			}
		}, 2000 );
	}
};