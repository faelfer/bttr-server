const app = require('./server.js')
require('dotenv/config');

app.listen(process.env.PORT || 3001);