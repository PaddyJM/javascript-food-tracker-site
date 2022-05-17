import express from "express"
import * as path from "path"

const app = express()

app.get('/', function (req, res) {
  res.sendFile('public/index.html', { root: path.resolve()})
})

app.listen(3000)

app.use(express.static('public'))