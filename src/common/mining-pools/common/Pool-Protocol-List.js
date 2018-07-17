import NodesList from 'node/lists/Nodes-List';

class PoolProtocolList{

    constructor(){

        this.list = [];


        this._checkDisconnection();
    }

    _checkDisconnection(){

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {

            this.deleteElementBySocket(nodesListObject.socket);

        });

    }


    addElement(socket){

        if (this.findElement(socket) !== -1) return false;

        this.list.push(socket);
        return true;

    }

    findElement(socket){

        for (let i=0; i<this.list.length; i++)
            if ( this.list[i] === socket )
                return i;

        return -1;

    }

    deleteElement(socket){

        let pos = this.findElement(socket);
        if (pos !== -1)
            this.list.splice(pos, 1);

    }


    deleteElementBySocket(socket){
        return this.deleteElement(socket);
    }

}

export default PoolProtocolList;