var express = require("express"), app = express();
app.use(express["static"](__dirname)).listen(2222);
