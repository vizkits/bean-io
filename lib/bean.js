'use strict';

var SerialPort = require('bean-serial').SerialPort;
var firmata = require('firmata');
var Bean = require('ble-bean');
var util = require('util');


function Board(options){
  options = options || {};

  var self = this;
  self.name = options.name || 'bean';
  self.pins = []; //j5 is a bit aggressive on wanting this ready
  self.uuid = options.uuid;

  var discoverCallback = function(bean) {
    console.log("Found bean: " + bean.uuid);
    self.connectedBean = bean;

    bean.on("disconnect", function(){
      process.exit();
    });

    bean.connectAndSetup(function(){

      bean.unGate(function(){

        //set color so you know its connected
        self.connectedBean.setColor(new Buffer([0, 64, 64]), function(err){
          //console.log('set color', err);
        });

        var serialPort = new SerialPort(self.connectedBean);

        Board.super_.call(self, serialPort, {skipHandshake: true, samplingInterval:60000});
        self.isReady = true;
        self.emit('connect');

        // turn off led after connect
        self.connectedBean.setColor(new Buffer([0x0,0x0,0x0]), function(){});

      });

    });

  };

  if (self.uuid) {
    Bean.discoverByUuid.call(this, self.uuid, discoverCallback);
  } else {
    Bean.discover.call(this, discoverCallback);
  }


  function exitHandler() {
    if (self.connectedBean) {
      // no way to know if succesful but often behind other commands going out, so just wait 2 seconds
      console.log('\nDisconnecting from Device...');
      setTimeout(self.connectedBean.disconnect.bind(self.connectedBean, function(){}), 2000);

    } else {
      process.exit();
    }
  }

  process.on('SIGINT', exitHandler.bind(self));

}

util.inherits(Board, firmata.Board);

module.exports = {
  Board: Board
};
