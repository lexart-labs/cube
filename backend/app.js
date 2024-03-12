const app = require('./server')

app.listen(port, function () {
  console.log(`ATLAS EDUCATION - BACKEND :: ${port}`)
})

module.exports = app;