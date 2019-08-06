var fs = require("fs");

fs.readFile("C:\\Users\\Steven\\Google Drive\\Evoman\\roms\\Steven Johnston - JA32W8FV4FU604417 - 096 097  - alt 1 - wgdcredline.hex.bin", function (err, buffer) {
    if (err) throw err;
    let nLoads = 22
    let loadsAddr = 0x61836
    let loads = Array.from(Array(nLoads)).map((_, i) => buffer.readInt16BE(loadsAddr+i*2)*10/32)
    console.log("loads", loads)
    let nRpms = 23
    let rpmsAdder = 0x61802
    let rpms = Array.from(Array(nRpms)).map((_, i) => buffer.readInt16BE(rpmsAdder+i*2)*1000/256)
    console.log("rpms", rpms)
    alt1TimmingAdder = 0xf1167
    loads = buffer.readInt8()
    
});