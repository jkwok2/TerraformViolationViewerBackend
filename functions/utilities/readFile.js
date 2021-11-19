const fs = require('fs');

const readFile = async (path) => {
  
    console.log("read file: " + path + "from efs");
    if (fs.existsSync(path)) {
        const f = fs.readFileSync(path);
        console.log(f);
    } else {
        console.log(path + "doesn't exist")
    }
};

module.exports = readFile;