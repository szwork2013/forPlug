var ccap = require('ccap');

var captcha2 = ccap({

    width:256,//set width,default is 256

    height:60,//set height,default is 60

    offset:0,//set text spacing,default is 40

    quality:0,//set pic quality,default is 50

});

function Ccad(){
}

module.exports = Ccad;

Ccad.start = function (callback) {
    var ary = captcha2.get();
    var txt = ary[0].toLowerCase();
    var buf = ary[1];
    callback(txt, buf);
}
