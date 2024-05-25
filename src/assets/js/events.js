import helpers from './helpers.js';
window.addEventListener( 'load', () => {
	function setCookie(cookieName, cookieValue, expirationDays, path = "/") {
		var d = new Date();
		d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=" + path;
	}
	document.getElementById( 'create-room' ).addEventListener( 'click', ( e ) => {
		e.preventDefault();
		let roomName = "KCP_class_room";
		let roomLink = `${ location.origin }?room=${ roomName.trim().replace( ' ', '_' ) }_${ helpers.generateRandomString() }`;
		setCookie('link', roomLink, 1);
		document.querySelector( '#room-created' ).innerHTML = `Room successfully created. Click <a href='${ roomLink }'>here</a> to enter room.`;
	} );
} );