import express from "express"



// INIT
const router = express.Router()


// ROUTES
router.get('/', (req, res) => {
  res.render("index")
})