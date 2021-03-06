'use strict';

if (typeof WebSocket === 'undefined') {
  var ws = require('ws');
} else {
  var ws = WebSocket;
}

const BFCPReceiver = require('./messages/BFCPReceiver');
const BFCPSender = require('./messages/BFCPSender');
const BFCPBase = require('./BFCPBase');

/**
 * This class handles basic functionality for the BFCP client
 * @extends {module:mconf-bfcp-js.BFCPBase} BFCPBase
 * @memberof module:mconf-bfcp-js
 * @fires {@link module:mconf-bfcp-js#event:open open}
 */
class BFCPBaseClient extends BFCPBase {
/**
 * Create a basic BFCP client
 * @param {external:WebSocket} [ws] An existent WebSocket connection
 */
  constructor (ws) {
    super();
    this._setupConnection(ws);
    this.eventCallbacks = {};
  }

  /**
   * Send message over the existing connection
   * @param  {module:mconf-bfcp-js.BFCPMessage} message The current message
   */
  send(message) {
    this._sender.sendMessage(message);
  }

  /**
   * Creates a new WebSocket connection
   * @param  {String} uri The WebSocket URI of the Media Control Server
   */
  createConnection(uri) {
    var websocket = new ws(uri);
    this._setupConnection(websocket);
  }

  /**
   * Close current WebSocket connection
   */
  closeConnection() {
    var _self = this;
    if (_self._ws) {
      _self._ws.close();
    }
  }

  _setupConnection(ws) {
    var _self = this;
    try {
      if (ws && typeof(ws) === 'object') {
        if (ws.readyState === ws.OPEN) {
          _self._initReceivers(ws);
        } else {
          ws.addEventListener('open', function () {
            _self._initReceivers(ws);
          });

          ws.addEventListener('close', () => {
            _self.emit('close');
          });

          ws.addEventListener('error', (error) => {
            _self.emit('error', error);
          });
        }
        _self._ws = ws;
      }
    } catch (error) {
      _self.emit('error', error);
    }
  }

  _initReceivers (client) {
    var _self = this;
    _self._initReceiver(client);
    _self._initSender(client);
    _self.emit('open');
  }

  _initReceiver(client) {
    const receiver = new BFCPReceiver(client);

    receiver.on('api', (name, args) => {
      this.emit(name, args);
      this._triggerCallback(name, args);
    });
  }

  _initSender(client) {
    this._sender = new BFCPSender(client);
  }

  _addEventCallback(eventName, identifier, callback) {
    if (this.eventCallbacks[eventName] == null) {
      this.eventCallbacks[eventName] = [];
    }

    this.eventCallbacks[eventName].push({ identifier, callback });
  }

  _triggerCallback(eventName, args) {
    const eventRegistry = this.eventCallbacks[eventName];
    if (eventRegistry) {
      const identifier = this._getValidIdentifier(eventName, args);
      eventRegistry
        .filter(e => e.identifier === identifier)
        .forEach(e => {
          e.callback(args)
        });
    }
  }

  // TODO
  _getValidIdentifier(eventName, payload) {
    let identifier;
    switch (eventName) {
      default:
        identifier = '';
        break;
    }

    return identifier;
  }
}

module.exports = BFCPBaseClient;
