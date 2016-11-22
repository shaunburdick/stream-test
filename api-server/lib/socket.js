'use strict';

let io = null;

exports.set = (socketio) => {
  io = socketio;
};

exports.get = () => io;
