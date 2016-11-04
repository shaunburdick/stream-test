'use strict';

var Default = require('./DefaultService');

module.exports.nodeGET = function nodeGET (req, res, next) {
  Default.nodeGET(req.swagger.params, res, next);
};
