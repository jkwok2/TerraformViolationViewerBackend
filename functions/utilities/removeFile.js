const fs = require('fs');

const removeFile = async (path) => {
  
    if (fs.existsSync(path)) {
        console.log("removing " + path);
        const f = fs.unlinkSync(path);
        console.log("done removing: " + path);
    } 
};

module.exports = removeFile;
