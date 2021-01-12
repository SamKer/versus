const bodyParser = require("body-parser");
module.exports.urlencoded = bodyParser.urlencoded({ extended : true });
module.exports.json = bodyParser.json({limit: '100000kb'});