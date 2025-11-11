const server = require("./app") // load up the web server

const port = process.env.PORT || 4000 // default to 4000 so CRA can stay on 3000

// call express's listen function to start listening to the port
const listener = server.listen(port, function () {
  console.log(`Server running on port: ${port}`)
})

// a function to stop listening to the port
const close = () => {
  listener.close()
}

module.exports = {
  close: close,
}
