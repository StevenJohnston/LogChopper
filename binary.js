var fs = require("fs");

fs.readFile("C:\\Users\\Steven\\Google Drive\\Evoman\\roms\\Steven Johnston - JA32W8FV4FU604417 - 096 097  - alt 1 - wgdcredline.hex.bin", function (err, buffer) {
    if (err) throw err;
    console.log(buffer);
    var find = new Buffer.alloc(4);
    find.writeInt8(27, 0)
    find.writeInt8(28, 1)
    find.writeInt8(30, 2)
    find.writeInt8(32, 3)
    ind = buffer.indexOf(find)
    console.log(ind)
    // str = buffer.toString('hex')
    // console.log(str.indexOf())
    for(var i = 0; i< 30; i++) {
      console.log(buffer.readInt8(ind+i))
    }
});