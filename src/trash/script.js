(function(d,w){
    const BASE_URL = 'http://localhost:3000';
    let FileInput, DropContainer, SendButton, ModalPreview, ImgPreview, Loader;
    let FileStash = [];
    const config = {
        format: 'webp',
        lossless: true
    }

    d.addEventListener('DOMContentLoaded', function(){
        FileInput = d.getElementById('FileInput');
        DropContainer = d.getElementById('DropContainer');
        SendButton = d.getElementById('SendButton');
        ModalPreview = d.getElementById('ModalPreview');
        ImgPreview = d.getElementById('ImgPreview');
        SelectFormat = d.getElementById('_configFormat');
        SelectGenLossless = d.getElementById('_gnLossless');
        Loader = d.getElementById('_loader');

        SelectFormat.value = config.format;
        DropContainer.addEventListener('click', event => {
            FileInput.click();
        })
        DropContainer.addEventListener('dragover', event => {
            event.preventDefault();
            DropContainer.classList.add('actived'); 
    
        })
        DropContainer.addEventListener('dragleave', event => {
            event.preventDefault();
            DropContainer.classList.remove('actived'); 
            
        })
        DropContainer.addEventListener('drop', event => {
            event.preventDefault();
            let files = event.dataTransfer.files;    
            if (!files) {
                console.log('[drop] Files not found');
                return;
            }
            if (files.length === undefined) {
                FileProcess(files);
                return;
            }
            for (const file of files) {
                FileProcess(file);
            }
        })


        FileInput.addEventListener('change', function(){
            let files = this.files;
            if (!files) {
                console.log('[change] Files not found');
                return;
            }
            if (files.length === undefined) {
                FileProcess(files);
                return;
            }
            for (const file of files) {
                FileProcess(file);
            }
        }, false)

        SelectFormat.addEventListener('change', event => {
            let value = event.target.value;
            if (!value) return;
            if (!FileStash.length) {
                value = '';
                return;
            }            
            config.format = event.target.value;
            FileStash = FileStash.map(item => {
                return {...item, format: value}
            })
            RenderFileList()
        })

        d.addEventListener('change', event => {
            let evt = event.target;
            if (evt.matches('[name=lossless-item]')){
                if (!['true','false'].includes(evt.value)) return;
    
                
                let lossless = (evt.value === 'true');
                config.lossless = lossless;
                FileStash = FileStash.map(item => {
                    return {...item, lossless: lossless}
                })
                RenderFileList()
            }
        })
        d.addEventListener('click', event => {
            let evt = event.target;
            if (evt.matches('[name=preview-item]')){
                if (!evt.dataset.url) return;
                ImgPreview.src = evt.dataset.url;
                ModalPreview.classList.add('show')
            }
            if (evt.matches('#modal-close')){
                ImgPreview.src = '';
                ModalPreview.classList.remove('show')
            }
        })

        SendButton.addEventListener('click', async event => {
            try {
                if (!FileStash.length) return;
                handleAlert({action: 'close'})
                Loader.classList.add('show')
                SendButton.disabled = true;

                let convert = await ConvertFiles();
                Loader.classList.remove('show')
                console.log(Loader)
                if (convert.ok) {
                    Loader.classList.remove('show')
                    handleAlert({
                        action: 'open', 
                        message: convert.ok,
                        time: 1500,
                        theme: 'success'
                    })
                    if (convert.url){
                        console.log(`${BASE_URL}/download?filename=${convert.url}`)
                        let download = d.getElementById('DownloadLink')
                        download.href = `${BASE_URL}/download?filename=${convert.url}`
                        download.innerHTML = convert.url
                    }
                    FileStash = []
                    RenderFileList()
                    SendButton.disabled = false;
                    return;
                }
                if (convert.warning){
                    handleAlert({
                        action: 'open', 
                        message: convert.warning,
                        time: 1500,
                        theme: 'warning'
                    })
                    return;
                }
                handleAlert({action: 'close'})
                SendButton.disabled = false;
                return;
            } catch (error) {
                SendButton.disabled = false;
                Loader.classList.remove('show')
                handleAlert({
                    action: 'open', 
                    message: 'Error al procesar',
                    time: 1500,
                    theme: 'danger'
                })
                console.log(error)
            }
        })
    })

        

    // F U N C T I O N S
    function FileProcess(file){
        let ext = file.name.split('.').pop();
        const ExtFilter = ['jpeg','jpg','png','txt','svg','gif','svg'];
        if (!ExtFilter.includes(ext)) {
            console.log(`[process] ${file.name} is not valid.`);
            return;
        }
        const id = `file-${Math.random().toString(32).substring(7)}`;
        file.status = 'pending';
        FileStash.push({
            id: id,
            name: file.name,
            status: 'Pendiente',
            file: file,
            format: config.format,
            lossless: config.lossless
        });       
        RenderFileList() 
    }
    function RenderFileList(){
        Loader.classList.add('show')
        let container = d.getElementById('FileTable');
        container.innerHTML = '';
        if (!FileStash.length){
            container.innerHTML = `
                <tr><td colspan="5" class="text-center">No Data</td></tr>
            `;
            return;
        }
        FileStash.forEach((item, index) => {           
            let url = URL.createObjectURL(item.file)
            container.innerHTML += `
                <tr>
                    <td>
                        <div class="img-preview-sm" name="preview-item" data-url="${url}">
                            <img src="${url}" />
                        </div>
                    </td>
                    <td>${item.name}</td>
                    <td>${item.format}</td>
                    <td>
                        <span class="status-tag">${item.status}</span>
                    </td>
                    <td name="button-cell" data-id="${item.id}">
                        <button class="file-button">Remove</button>
                    </td>
                </tr>
            `;
        });
        Loader.classList.remove('show')
    }

    async function ConvertFiles(files = ''){
        try {            
            let data = new FormData();         
            FileStash.forEach(item => {
                data.append('images', item.file);
            })
            data.append('format', config.format);
            data.append('lossless', config.lossless);
            let send = await fetch(`${BASE_URL}/conversion`, {
                method: 'POST',
                body: data
            });
            let response = await send.json();
            return response;            
        } catch (error) {
            handleAlert({action: 'close'})
            console.log(error)
        }
    }

    function handleAlert(setts){
        try {
            let popup = d.getElementById('PopupAlert')
            if (!setts.action) return;
            if (setts.action === 'open'){
                popup.classList.add('show')
                popup.innerHTML = setts.message
                if (setts.theme) {
                    popup.classList.add('popup-'+setts.theme)
                }
                if (setts.time > 0){
                    setTimeout(() => {
                        popup.classList.remove('show')
                        popup.innerHTML = ''
                    }, setts.time);
                }
            }
            if (setts.action === 'close'){
                popup.classList.remove('show')
                popup.innerHTML = ''
                popup.className = 'popup'
            }
        } catch (error) {
            console.log(error)
        }
    }


})(document,window);