/*
 * Project:     TokPanel
 * Description: Talk show format web application with host view, user
 *              view, and moderator view. Up to five people are queued
 *              by the moderator, who can decided whether to allow user
 *              to broadcast his/her signal.          
 * Website:     http://tokshow.opentok.com
 * 
 * Author:      Ezra Velazquez
 * Website:     http://ezraezraezra.com
 * Date:        August 2011
 * 
 */

var load_js = function audience_load_js(){
	var apiKey = 1543171;
	var sessionId = '2e64995e8430731ecedd002cf38ddebc03bee515';
	var token;
	var session;
	var publisher;
	var subscribers = {};
	var user_connection_id;
	var conn_id_array = [];
	var conn_id_array_index = 0;
	var gaga_id = 'blah';
	var queue_list = [];
	var stage;
	var me_publishing = false;
	var user_type = 2; // 1 = Moderator
	// 2 = Client, queue
	// 3 = Client, bat
	// 4 = Gaga
	// 5 = Done
	// Once person is removed, they won't need to be in the list anymore
	// Mod & Gaga change the vars to their liking, otherwise everyone is a client
	for (x = 0; x < 7; x++) {
		queue_list[x] = false;
	}
	var test_on_queue = [];
	var test_on_stage = [];
	var done_ids = [];
	var done_ids_index = 0;
	var mod_id = 'blah';
	var cam_still_needed = false;
	var queue_warning = 0;
	
	$(document).ready(function() {
		startTB(2);
	});
	
	function startTB(temp_var){
		user_type = temp_var;
		
		$.get('php/back.php', {
			comm: 'tbAPI'
		}, function(data){
			token = data.token;
			
			/*
			 * OPENTOK CODE
			 */
			TB.addEventListener("exception", exceptionHandler);
			
			if (TB.checkSystemRequirements() != TB.HAS_REQUIREMENTS) {
				alert("You don't have the minimum requirements to run this application." +
				"Please upgrade to the latest version of Flash.");
			}
			else {
				session = TB.initSession(sessionId);
				session.addEventListener('sessionConnected', sessionConnectedHandler);
				session.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
				session.addEventListener('connectionCreated', connectionCreatedHandler);
				session.addEventListener('connectionDestroyed', connectionDestroyedHandler);
				session.addEventListener('streamCreated', streamCreatedHandler);
				session.addEventListener('streamDestroyed', streamDestroyedHandler);
				session.addEventListener("signalReceived", signalReceivedHandler);
			}
			connect();
		});
	}
	
	function getState(){
		$.get('php/back.php', {
			comm: 'state'
		}, function(data){
			test_on_queue = data.on_queue;
			test_on_stage = data.on_stage;
			
			if (data.on_queue != "err") {
				for (x = 0; x < data.on_queue.length; x++) {
					if (x === 0 && data.on_queue[x] != user_connection_id) {
						others_view = document.getElementById(data.on_queue[x]);
						if (others_view !== null) {
							others_view.style.display = "none";
						}
					}
					else 
						if (data.on_queue[x] != user_connection_id) {
							others_view = document.getElementById(data.on_queue[x]);
							if (others_view !== null) {
								others_view.style.display = "none";
							}
						}
					if (data.on_queue[x] == user_connection_id) {
						cam_still_needed = true;
						if (me_publishing === false) {
							startPublishing();
						}
					}
				}
			}
			if (data.on_stage != "err") {
				for (x = 0; x < data.on_stage.length; x++) {
					if (data.on_stage[x] == user_connection_id) {
						cam_still_needed = true;
						hide('queue_warning');
						show('on_stage_message');
						others_view = document.getElementById('right_speaker_container_big');
						others_view.style.display = "none";
						return;
					}
					else {
						others_view = document.getElementById('right_speaker_container_big');
						others_view.style.display = "block";
						others_cam = document.getElementById(data.on_stage[x]);
						if (others_cam !== null) {
							others_cam.style.display = "block";
						}
					}
				}
			}
			if (me_publishing === true && cam_still_needed === false) {
				stopPublishing();
				me_publishing = false;
			}
			cam_still_needed = false;
		});
	}
	
	//--------------------------------------
	//  LINK CLICK HANDLERS
	//--------------------------------------
	
	function connect(){
		session.connect(apiKey, token);
	}
	
	function disconnect(){
		session.disconnect();
	}
	
	function startPublishing(){
		if (!publisher) {
			var text_holder = document.getElementById("me_text");
			text_holder.style.display = "block";
			
			var parentDiv = document.getElementById("queue_5");
			parentDiv.style.display = "block";
			parentDiv.style.zIndex = 10;
			var publisherDiv = document.createElement('div');
			publisherDiv.setAttribute('id', 'opentok_publisher');
			parentDiv.appendChild(publisherDiv);
			var publisherProps = {
				width: 300,
				height: 200,
				publishAudio: true
			};
			publisher = session.publish(publisherDiv.id, publisherProps);
			me_publishing = true;
			hide('just_listening');
			if (document.getElementById("queue_5").style.display == 'block' & queue_warning === 0) {
				show('queue_warning');
				queue_warning = 1;
			}
		}
	}
	
	function stopPublishing(){
		if (publisher) {
			session.unpublish(publisher);
			hide('on_stage_message');
		}
		publisher = null;
		var me_holder = document.getElementById("me_container");
		me_holder.style.display = "none";
	}
	
	function signal(){
		session.signal();
	}
	
	function forceDisconnectStream(streamId){
		session.forceDisconnect(subscribers[streamId].stream.connection.connectionId);
	}
	
	function forceUnpublishStream(streamId){
		session.forceUnpublish(subscribers[streamId].stream);
	}
	
	//--------------------------------------
	//  OPENTOK EVENT HANDLERS
	//--------------------------------------
	
	function sessionConnectedHandler(event){
		user_connection_id = session.connection.connectionId;
		
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == user_connection_id) {
				// Can't add moderator to be eligle to chat
			}
			else {
				// Add to user's who can chat with gaga
				conn_id_array[conn_id_array_index] = event.connections[i].connectionId;
				conn_id_array_index = conn_id_array_index + 1;
			}
		}
		
		jQuery.ajaxSetup({
			async: false
		});
		getState();
		jQuery.ajaxSetup({
			async: true
		});
		
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
	}
	
	function streamCreatedHandler(event){
		for (var i = 0; i < event.streams.length; i++) {
			addStream(event.streams[i]);
		}
	}
	
	function streamDestroyedHandler(event){
		for (var i = 0; i < event.connections.length; i++) {
			foo = document.getElementById(event.connections[i].connectionId);
			document.body.removeChild(foo);
		}
	}
	
	function signalReceivedHandler(event){
		mod_id = event.fromConnection.connectionId;
		if (event.fromConnection.connectionId == user_connection_id) {
		
		}
		else {
			getState();
		}
	}
	
	function sessionDisconnectedHandler(event){
		publisher = null;
	}
	
	function connectionDestroyedHandler(event){
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == mod_id) {
				// Moderator left, unpublish everyone
				stopPublishing();
			}
			if (event.connections[i].connectionId == gaga_id) {
				gaga_id = "blah";
				return;
			}
		}
	}
	
	function connectionCreatedHandler(event){
		for (var i = 0; i < event.connections.length; i++) {
			if (event.connections[i].connectionId == user_connection_id) {
				// Can't add moderator to be eligle to chat
			}
			else {
				// Add to user's who can chat with gaga
				conn_id_array[conn_id_array_index] = event.connections[i].connectionId;
				conn_id_array_index = conn_id_array_index + 1;
			}
		}
	}
	
	function exceptionHandler(event){
		alert("Exception: " + event.code + "::" + event.message);
	}
	
	
	//--------------------------------------
	//  HELPER METHODS
	//--------------------------------------
	
	function addStream(stream){
		// Check if this is the stream that I am publishing, and if so do not publish.
		if (stream.connection.connectionId == session.connection.connectionId) {
			return;
		}
		//Check for the gaga variable
		if (gaga_id == 'blah') {
			jQuery.ajaxSetup({
				async: false
			});
			$.get('php/back.php', {
				comm: 'gaga'
			}, function(data){
				if (data.status == 400) {
					add_to_queue(stream);
				}
				else {
					gaga_id = data.gaga_id;
					var subscriberDiv = document.createElement('div');
					subscriberDiv.setAttribute('id', stream.streamId);
					document.getElementById('left_speaker').appendChild(subscriberDiv);
					var subscriberProps = {
						width: 300,
						height: 200,
						subscribeToAudio: true
					};
					subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
					return;
				}
			});
			jQuery.ajaxSetup({
				async: true
			});
		}
		else {
			add_to_queue(stream);
		}
	}
	
	function add_to_queue(stream){
		var subscriberHolder = document.createElement('div');
		subscriberHolder.setAttribute('id', stream.connection.connectionId);
		var r_s_c = document.getElementById('right_speaker_container');
		r_s_c.appendChild(subscriberHolder);
		
		var subscriberDiv = document.createElement('div');
		subscriberDiv.setAttribute('id', stream.streamId);
		subscriberHolder.appendChild(subscriberDiv);
		subscriberHolder.style.display = "none";
		if (stream.connection.connectionId == test_on_stage[0]) {
			subscriberHolder.style.display = "block";
		}
		
		var subscriberProps = {
			width: 300,
			height: 200,
			subscribeToAudio: true
		};
		subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
	}
	
	function show(id){
		document.getElementById(id).style.display = 'block';
	}
	
	function hide(id){
		document.getElementById(id).style.display = 'none';
	}
}();
