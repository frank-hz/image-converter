const fs = require('fs')
const sharp = require('sharp')
const multer = require('multer')
const VALID_FORMATS = ['jpeg','jpg','png','gif','webp']
const JSZip = require('jszip')
const zip = JSZip()
const upload = multer()
// const upload = multer({storage: multer.memoryStorage()})


const ConversionController = async (req, res) => {
    let data = req.body
    let fileArray = req.files
    let format = data.format
    let loss = (data.lossless) ? true : false
    if (!fileArray.length) {
        res.json({warning: 'No hay archivos que convertir.'})
        return;
    }
    let success = 0
    let log = []
    let fileStash = []
    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];            
        const ext = file.originalname.split('.').pop()
        const name = file.originalname.replace('.'+ext, '')            
        const url = `src/storage/${name}.${format}`
        if (!file) {
            res.json({ warning: 'Archivo no encontrado' })
            continue
        }
        if (!format || !VALID_FORMATS.includes(format)) {
            res.json({ warning: 'Formato de conversion no valido.' })
            continue
        }
        let imageConvert = await sharp(file.buffer).toFormat(
            format, {lossless: loss}
        ).toBuffer()
        // let save = await fs.writeFileSync(url, imageConvert)
        // let read_file = fs.readFileSync(url)
        // if (!read_file) {
        //     res.json({warning: 'No se completo el proceso'})
        //     continue
        // }
        fileStash.push({
            name: `${name}.${format}`,
            data: imageConvert
        })
        success++;
    }
    let zip = await CreateZip(fileStash)
    res.json({
        ok: `${success} archivos convertidos`,
        url: (fileStash.length) ? zip  : ''
    })
}

async function CreateZip(data){
    try {
        const name = ZipName(15)
        const url = `src/temp/${name}.zip`
        const folder = zip.folder('')
        for (item of data) {
            folder.file(item.name, item.data)        
        }
        let stream = await zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        let create = await stream.pipe(fs.createWriteStream(url))
        console.log(`${name}.zip created`);
        return name
    } catch (error) {
        console.log(error)
    }
}
function ZipName(length) {  
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    let counter = 0;
    let name = '';
    while (counter < length) {
        name += chars.charAt(Math.floor(Math.random() * charsLength));
        counter += 1;
    }
    return 'conversion_'+name;
}


module.exports = {ConversionController}