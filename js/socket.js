"use strict"

/**
 * 创建Vue实例
 */
var Vm = new Vue({
    el: "#root",
    data: {
        consoleData: [], // 控制台日志
        messageData: [], // 消息记录
        instance: WebSocket, // ws instance
        address: 'ws://192.252.182.94:9998/ws', // 链接地址
        nickname: 'luke',
        alert: {
            class: 'success',
            state: false,
            content: '',
            timer: undefined
        },
        content: '',
        heartBeatSecond: 1,
        heartBeatContent: '',
        autoSend: false,
        autoTimer: undefined,
        sendClean: true,
        secvClean: false,
        recvClean: false,
        recvDecode: false,
        connected: false,
        recvPause: false,
        raiseNum: 1000
    },
    created: function created () {
        this.canUseH5WebSocket()
        var address = localStorage.getItem('address');
        if (typeof address === 'string') this.address = address
        window.onerror = function (ev) {
            console.warn(ev)
        }
    },
    filters: {
        rStatus: function (value) {
            switch (value) {
                case undefined:
                    return '尚未创建'
                case 0 :
                    return '尚未开启'
                case 1:
                    return '连接成功'
                case 2:
                    return '正在关闭'
                case 3:
                    return '连接关闭'
            }
        }
    },
    methods: {
        showTips: function showTips (className, content) {
            clearTimeout(this.alert.timer);
            this.alert.state   = false;
            this.alert.class   = className;
            this.alert.content = content;
            this.alert.state   = true;
            this.alert.timer   = setTimeout(function () {
                Vm.alert.state = false;
            }, 3000);
        },
        autoWsConnect: function () {
            try {
                if (this.connected === false){
                    localStorage.setItem('address', this.address)
                    var nickname = this.nickname;
                    var wsInstance = new WebSocket(this.address);
                    var _this      = Vm;
                    if (!nickname) {
                        _this.writeConsole('danger', 'Nickname不能为空');
                        return;
                    }
                    if (nickname.length > 10) {
                        _this.writeConsole('danger', 'Nickname不能超出10个字符');
                        return;
                    }
                    wsInstance.onopen    = function (ev) {
                        console.warn(ev)
                        _this.connected = true
                        var service     = _this.instance.url.replace('ws://', '').replace('wss://', '');
                        service         = (service.substring(service.length - 1) === '/') ? service.substring(0, service.length - 1) : service;
                        _this.instance.send(JSON.stringify({
                            data: JSON.stringify({
                                ID: new Date().getTime(),
                                Name: nickname,
                                Score: 100
                            })
                        }));
                        _this.writeAlert('success', 'Connect to ' + service.toString());
                    }
                    wsInstance.onclose   = function (ev) {
                        console.warn(ev)
                        _this.autoSend = false;
                        clearInterval(_this.autoTimer);
                        _this.connected = false;
                        _this.writeAlert('danger', 'CLOSED => ' + _this.closeCode(ev.code));
                    }
                    wsInstance.onerror   = function (ev) {
                        console.warn(ev)
                        _this.writeConsole('danger', '发生错误 请打开浏览器控制台查看')
                    }
                    wsInstance.onmessage = function (ev) {
                        var enc = new TextDecoder('utf-8');
                        ev.data.arrayBuffer().then(buffer => {
                            let data = JSON.parse(enc.decode(new Uint8Array(buffer))) || {};
                            if (!_this.recvPause) {
                                var msg = data.data;
                                console.warn(msg);
                                // if (_this.recvClean) _this.messageData = [];
                                if (msg === 'INTERACTIVE_SIGNAL_START') {
                                    window.is = true;
                                } else if(msg === 'INTERACTIVE_SIGNAL_STOP'){
                                    window.is = false;
                                } else if(msg.includes("say:")) {
                                    _this.writeConsole('success', msg)
                                } else {
                                    _this.writeNews(0, msg);
                                }
                            }
                        })

                    }
                    this.instance        = wsInstance;
                }else {
                    this.instance.close(1000, 'Active closure of the user')
                }
            } catch (err) {
                console.warn(err)
                this.writeAlert('danger', 'Connect server [' + this.address + '] fail, please choose another server.')
            }
        },
        autoHeartBeat: function () {
            var _this = Vm
            if (_this.autoSend === true) {
                _this.autoSend = false;
                clearInterval(_this.autoTimer);
            } else {
                _this.autoSend  = true
                _this.autoTimer = setInterval(function () {
                    _this.writeConsole('info', '循环发送: ' + _this.heartBeatContent)
                    _this.sendData(_this.heartBeatContent);
                }, _this.heartBeatSecond * 1000);
            }
        },
        writeConsole: function (className, content) {
            this.consoleData.push({
                content: content,
                type: className,
                time: moment().format('HH:mm:ss')
            });
            this.$nextTick(function () {
                if (!Vm.secvClean) {
                    Vm.scrollOver(document.getElementById('console-box'));
                }
            })
        },
        writeNews: function (direction, content, callback) {
            if (typeof callback === 'function') {
                content = callback(content);
            }

            this.messageData.push({
                direction: direction,
                content: content,
                time: moment().format('HH:mm:ss')
            });

            this.$nextTick(function () {
                if (!Vm.recvClean) {
                    Vm.scrollOver(document.getElementById('message-box'));
                }
            })
        },
        writeAlert: function (className, content) {
            this.writeConsole(className, content);
            this.showTips(className, content);
        },
        canUseH5WebSocket: function () {
            if ('WebSocket' in window) {
                this.showTips('success', '初始化完成');
            }
            else {
                this.writeAlert('danger', '当前浏览器不支持 H5 WebSocket 请更换浏览器')
            }
        },
        closeCode: function (code) {
            var codes = {
                1000: '1000 CLOSE_NORMAL',
                1001: '1001 CLOSE_GOING_AWAY',
                1002: '1002 CLOSE_PROTOCOL_ERROR',
                1003: '1003 CLOSE_UNSUPPORTED',
                1004: '1004 CLOSE_RETAIN',
                1005: '1005 CLOSE_NO_STATUS',
                1006: '1006 CLOSE_ABNORMAL',
                1007: '1007 UNSUPPORTED_DATA',
                1008: '1008 POLICY_VIOLATION',
                1009: '1009 CLOSE_TOO_LARGE',
                1010: '1010 MISSING_EXTENSION',
                1011: '1011 INTERNAL_ERROR',
                1012: '1012 SERVICE_RESTART',
                1013: '1013 TRY_AGAIN_LATER',
                1014: '1014 CLOSE_RETAIN',
                1015: '1015 TLS_HANDSHAKE'
            }
            var error = codes[code];
            if (error === undefined) error = '0000 UNKNOWN_ERROR 未知错误';
            return error;
        },
        sendData: function (raw) {
            var _this = Vm
            var data  = raw
            if (typeof data === 'object') {
                data = _this.content
            }
            if (data === '') {
                _this.writeConsole('danger', '指令不能为空');
                return;
            }
            try {
                _this.instance.send(JSON.stringify({data: data}));
                _this.writeNews(1, data);
                if (_this.sendClean && typeof raw === 'object') _this.content = '';
            } catch (err) {
                _this.writeAlert('danger', '消息发送失败 原因请查看控制台');
                throw err;
            }
        },
        scrollOver: function scrollOver (e) {
            if (e) {
                e.scrollTop = e.scrollHeight;
            }
        },
        cleanMessage: function () {
            this.messageData = [];
        },
        cleanConsole: function () {
            this.consoleData = [];
        },
        handleKeydown(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                // 仅当未按下 Shift 时，触发提交逻辑
                event.preventDefault(); // 阻止默认行为（如换行）
                this.sendData(event);
            }
        },
        call() {
            this.sendData('call');
        },
        raise() {
            this.sendData('raise ' + this.raiseNum);
        },
        check() {
            this.sendData('check');
        },
        fold() {
            this.sendData('fold');
        },
        allin() {
            this.sendData('allin');
        }
    }
});
