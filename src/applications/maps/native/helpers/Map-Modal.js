class MapModal {

    constructor() {
        this._container = document.querySelector('.map-dialog-description');
        this._iconMyself = document.querySelector('.map-dialog-description .icon-myself');
        this._iconWebPeer = document.querySelector('.map-dialog-description .icon-webPeer');
        this._iconClientSocket = document.querySelector('.map-dialog-description .icon-clientSocket');
        this._iconServerSocket = document.querySelector('.map-dialog-description .icon-serverSocket');
        this._text = document.querySelector('.map-dialog-description .map-dialog-description-text');
    }

    _hideAllIcons(exclude){
        if (exclude !== this._iconMyself)  this._iconMyself.style.display = 'none';
        if (exclude !== this._iconWebPeer)  this._iconWebPeer.style.display = 'none';
        if (exclude !== this._iconServerSocket)  this._iconServerSocket.style.display = 'none';
        if (exclude !== this._iconClientSocket)  this._iconClientSocket.style.display = 'none';
    }

    _setNodeType(nodeType) {

        let icon;

        if (nodeType === 'myself')
            icon = this._iconMyself;
        else if (nodeType === 'webPeer')
            icon = this._iconWebPeer;
        else if (nodeType === 'clientSocket')
            icon = this._iconClientSocket;
        else if (nodeType === 'serverSocket')
            icon = this._iconServerSocket;

        icon.style.display = 'inline-block';
        this._hideAllIcons(icon);

    }

    show(desc) {
        this._setNodeType(desc.nodeType);

        this._text.innerHTML = `<b>${desc.status} </b><br>${desc.country}, ${desc.city}<br><small>${desc.address || '&nbsp;'}</small>`;
        this._container.style.opacity = 1;
    }

    hide() {
        this._container.style.opacity = 0;
    }
}

export default MapModal