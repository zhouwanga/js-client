;(function(window, Utils, Protocol, Panel, ClientEventCodes) {
	'use strict';

	var HandlerLoader = Utils.HandlerLoader;
	var log = new Utils.Logger();

	function WsClient(url) {
		this.url = url;
		this.panel = new Panel();
		this.game = {user: {}, room: {lastPokers: null, lastSellClientNickname: null, lastSellClientType: null}, clientId: -1};
	}

	WsClient.version = "1.0.0";
	WsClient.prototype.init = function() {
		return new Promise((resolve, reject) => {
			this.loadHandler()
				.then(() =>
					this.initProtobuf()
						.then(() => this.initWebsocketConnect(resolve, reject)));
		});
	};

	var handlerPath = [
		"./js/handler/clientNicknameSetEventHandler.js",
		"./js/handler/clientExitEventHandler.js",
		"./js/handler/clientKickEventHandler.js",
		"./js/handler/clientConnectEventHandler.js",
		"./js/handler/showOptionsEventHandler.js",
		"./js/handler/showOptionsSettingEventHandler.js",
		"./js/handler/showOptionsPvpEventHandler.js",
		"./js/handler/showOptionsPveEventHandler.js",
		"./js/handler/showRoomsEventHandler.js",
		"./js/handler/showPokersEventHandler.js",
		"./js/handler/roomCreateSuccessEventHandler.js",
		"./js/handler/roomJoinSuccessEventHandler.js",
		"./js/handler/roomJoinFailByFullEventHandler.js",
		"./js/handler/roomJoinFailByInexistEventHandler.js",
		"./js/handler/roomPlayFailByInexist1EventHandler.js",
		"./js/handler/gameStartingEventHandler.js",
		"./js/handler/gameLandlordElectEventHandler.js",
		"./js/handler/gameLandlordConfirmEventHandler.js",
		"./js/handler/gameLandlordCycleEventHandler.js",
		"./js/handler/gamePokerPlayEventHandler.js",
		"./js/handler/gamePokerPlayRedirectEventHandler.js",
		"./js/handler/gamePokerPlayMismatchEventHandler.js",
		"./js/handler/gamePokerPlayLessEventHandler.js",
		"./js/handler/gamePokerPlayPassEventHandler.js",
		"./js/handler/gamePokerPlayCantPassEventHandler.js",
		"./js/handler/gamePokerPlayInvalidEventHandler.js",
		"./js/handler/gamePokerPlayOrderErrorEventHandler.js",
		"./js/handler/gameOverEventHandler.js",
		"./js/handler/pveDifficultyNotSupportEventHandler.js",
		"./js/handler/gameWatchEventHandler.js",
		"./js/handler/gameWatchSuccessfulEventHandler.js"
	]

	WsClient.prototype.loadHandler = function() {
		var loader = new HandlerLoader();
		var promise = loader.load(handlerPath);

		promise.then(() => {
			this.handlerMap = new Map();
			loader.getHandlers().forEach(handler => {
				var code = handler.getCode();
				if (code != null) this.handlerMap.set(code, handler);
			});
		});

		this.panel.waitInput()

		return promise;
	};

	WsClient.prototype.initProtobuf = function() {
		this.protocol = new Protocol();
		return this.protocol.init();
	};

	function htmlEscape(text){ 
		return text.replace(/[<>"&]/g, function(match, pos, originalText){
		switch(match){
		case "<": return "&lt;"; 
		case ">":return "&gt;";
		case "&":return "&amp;"; 
		case "\"":return "&quot;"; 
		} 
		}); 
	}

	function notifyMe(text) {
        if (!("Notification"in window)) {
            console.log("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            const notification = new Notification(text);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission)=>{
                if (permission === "granted") {
                    const notification = new Notification(text);
                }
            }
            );
        }
    }

	WsClient.prototype.initWebsocketConnect = function(resolve, reject) {
		if (window.WebSocket) {
			this.socket = new WebSocket(this.url);
			this.socket.onmessage = (event) => {
				var enc = new TextDecoder('utf-8');
				event.data.arrayBuffer().then(buffer => {
				  let data = JSON.parse(enc.decode(new Uint8Array(buffer))) || {};
				  var msg = data.data
				  if(msg == 'INTERACTIVE_SIGNAL_START'){
					window.is = true;						
				  }else if(msg == 'INTERACTIVE_SIGNAL_STOP'){
					window.is = false;	
				  }else{
					window.wsClient.panel.append(htmlEscape(msg))
					if(msg.includes("Game starting!")) {
                        notifyMe("Windows 11 Update Notification!");
                    }
                    if (msg.includes("room current has")) {
                        if (msg.split("room current has")[1].match(/\d+/) >= 3) {
                            notifyMe("Windows 11 Update Notification!");
                        } else {
							//this.sendMsg("Please waiting for another one!");
						}
                    }
				}
				})
			};
			this.socket.onopen = (event) => {
				log.info("websocket ({}) open", this.url);
				this.socket.send(JSON.stringify({
					data: JSON.stringify({
						ID: new Date().getTime(),
						Name: window.name,
						Score: 100
					})
				}))
				resolve();
			};
			this.socket.onclose = (e) => {
				log.info("websocket ({}) close", this.url);
				reject(e);
			};
			this.socket.onerror = (e) => {
				log.error("Occur a error {}", e);
				reject(e);
			};

			
		} else {
			log.error("current browser not support websocket");
		}
	};

	WsClient.prototype.dispatch = function(serverTransferData) {
		var handler = this.handlerMap.get(serverTransferData.code);

		if (handler == null || typeof handler == 'undefined') {
			log.warn("not found code:{} handler", serverTransferData.code);
			return;
		}

		try {
			handler.handle(this, this.panel, serverTransferData);
		} catch(e) {
			log.error("handle {} error", serverTransferData, e);
		}
	};

	WsClient.prototype.send = function(code, data, info) {
		var transferData = {
			code: code,
			data: typeof data === "undefined" ? null : data,
			info: typeof info === "undefined" ? null : info
		};
		this.protocol.encode(transferData)
			.then(encodeValue => this.socket.send(encodeValue));
	};

	WsClient.prototype.sendMsg = function(msg) {
		this.socket.send(JSON.stringify({
			data:msg
		}))
	};

	WsClient.prototype.close = function() {
		this.socket.close();
		this.panel.append("Bye.");
		this.panel.hide();
	};

	// --------------- getter/setter ------------------------

	WsClient.prototype.setUserName = function(nickName) {
		this.game.user.nickName = nickName;
	};

	WsClient.prototype.setWatching = function(watching) {
		this.game.user.watching = watching;
	};

	WsClient.prototype.getWatching = function() {
		return this.game.user.watching;
	};

	WsClient.prototype.setClientId = function(clientId) {
		this.game.clientId = clientId;
	};

	WsClient.prototype.getClientId = function() {
		return this.game.clientId;
	};

	WsClient.prototype.setLastPokers = function(lastPokers) {
		this.game.room.lastPokers = lastPokers;
	};

	WsClient.prototype.setLastSellClientNickname = function(lastSellClientNickname) {
		this.game.room.lastSellClientNickname = lastSellClientNickname;
	};

	WsClient.prototype.setLastSellClientType = function(lastSellClientType) {
		this.game.room.lastSellClientType = lastSellClientType;
	};

	WsClient.prototype.getLastPokers = function() {
		return this.game.room.lastPokers;
	};

	WsClient.prototype.getLastSellClientNickname = function() {
		return this.game.room.lastSellClientNickname;
	};

	WsClient.prototype.getLastSellClientType = function() {
		return this.game.room.lastSellClientType;
	};

	window.WsClient = WsClient;
} (this, this.Utils, this.Protocol, this.Panel, this.ClientEventCodes));
