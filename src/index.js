const express = require('express') 
const app = express()
const path = require('path')



// Midlewares
app.set('port', process.env.PORT || 3000)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(require('./routes'))


// Static
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'img')))




app.listen(app.get('port'), function(){
    console.log(`live in http://localhost:${app.get('port')}`);
})