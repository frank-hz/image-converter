const DownloadController = (req, res) => {
    const folderPath = '../'+__dirname + '/temp'
    const name = req.query.filename+'.zip'
    res.download(`${folderPath}/${name}`)
}

module.exports = {DownloadController}