import express from 'express'
import mus from "mustache-express"


// INIT
const app = express()

// Config
app.set("views", "./views")  // Set views folder as default folder for templates
app.set("view engine", "html")  // Use html as template engine
app.engine('html', mustache())  // Use mustache as template engine


// Enable routes
// GET routes
app.get('/', router)


// Static files
app.use(express.static('./public'))

// LISTEN
app.listen(3000, () => {
  console.log('Listening on port 3000')
  console.log('Click here: http://localhost:3000/')
})

