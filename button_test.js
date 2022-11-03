/*
   Eclipse Paho MQTT-JS Utility
   by Elliot Williams for Hackaday article, 
*/ 

// Global variables
var client       = null;
var led_is_on    = null;
// These are configs	
var hostname       = "adm.it-arzamas.ru";
var port           = "1884";
var clientId       = "mqtt_js_" + parseInt(Math.random() * 100000, 10);
var temp_topic     = "tele/tasmota_9AD490/SENSOR";
var humidity_topic = "tele/tasmota_9AD490/STATE";
var status_topic   = "tele/tasmota_9AD490/LWT";

// This is called after the webpage is completely loaded
// It is the main entry point into the JS code
function connect(){
	// Set up the client
	client = new Paho.MQTT.Client(hostname, Number(port), clientId);
	client.userName=getCookie ( "username" );
	client.password=getCookie ("password");

	console.info('Connecting to Server: Hostname: ', hostname, 
			'. Port: ', port, '. Client ID: ', clientId);

	// set callback handlers
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;

	// see client class docs for all the options
	var options = {
		onSuccess: onConnect, // after connected, subscribes
		onFailure: onFail     // useful for logging / debugging
	};
	// connect the client
	client.connect(options);
	console.info('Connecting...');
}


function onConnect(context) {
	console.log("Client Connected");
    // And subscribe to our topics	-- both with the same callback function
	options = {qos:0, onSuccess:function(context){ console.log("subscribed"); } }
	client.subscribe(temp_topic, options);
	client.subscribe(humidity_topic, options);
	client.subscribe(status_topic, options);
}

function onFail(context) {
	console.log("Failed to connect");
}

function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("Connection Lost: " + responseObject.errorMessage);
		window.alert("Someone else took my websocket!\nRefresh to take it back.");
	}
}

// Here are the two main actions that drive the webpage:
//  handling incoming messages and the toggle button.

// Updates the webpage elements with new data, and 
//  tracks the display LED status as well, 
//  in case multiple clients are toggling it.
function onMessageArrived(message) {
	var MQTTnames = ["DS18B20","Time"];
var MQTTvalues = [0,0,0];
	console.log(message.destinationName, message.payloadString);

	// Update element depending on which topic's data came in
	if (message.destinationName == temp_topic){ 
		console.log(message);
				
		var temperature_heading = document.getElementById("temp_display");
		//for (var i=0; i < MQTTnames.length; i++) {
	//		if (message.destinationName == MQTTnames[i]) {
	//			MQTTvalues[i] = Number(message.payloadString);
		
		//}
	//	}
		myarr=JSON.parse(message.payloadString);
		datetime=myarr['Time'].split('T');

		temperature_heading.innerHTML = "День:"+"&nbsp"+datetime[0] +"<br> &nbsp &nbsp"+"Время : "+"&nbsp"+datetime[1] +"&nbsp &nbsp Temperature: " + myarr['DS18B20'].Temperature + " &deg;C";
	/*} else if (message.destinationName == humidity_topic) {
		var humidity_heading = document.getElementById("humidity_display");
		humidity_heading.innerHTML = "Humidity: " + message.payloadString + "%";*/
	} else if (message.destinationName == status_topic) {
		var status_heading = document.getElementById("led_status");
		status_heading.innerHTML = "Статус устройства: " + message.payloadString;
		// Accomodates one or two byte "on" commands.  Anything else is off.
		if (message.payloadString == "on" || message.payloadString == "o"){
			led_is_on = true;
		} else {
			led_is_on = false;
		}
	}
}

// Provides the button logic that toggles our display LED on and off
// Triggered by pressing the HTML button "status_button"
function led_toggle(){
	if (led_is_on){
		var payload = "off";
		led_is_on = false;
	} else {
		var payload = "on";
		led_is_on = true;
	}

	// Send messgae
	message = new Paho.MQTT.Message(payload);
	message.destinationName = status_topic;
	message.retained = true;
	client.send(message);
	console.info('sending: ', payload);
}

