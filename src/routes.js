const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({storage: multer.memoryStorage()})

// Controllers
const {HomeController} = require('./controllers/home')
const {ConversionController} = require('./controllers/conversion')

router.get('/', HomeController)
router.post('/conversion', upload.array('images'), ConversionController)
router.get('/download', (req, res) => {
    const folderPath = __dirname + '/temp'
    const name = req.query.filename+'.zip'
    res.download(`${folderPath}/${name}`)
})



module.exports = router