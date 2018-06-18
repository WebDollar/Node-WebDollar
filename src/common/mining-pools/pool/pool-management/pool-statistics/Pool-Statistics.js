class PoolStatistics{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

        setInterval( this._poolStatisticsInterval.bind(this), 1000 );

    }

    _poolStatisticsInterval(){

    }

}

export default PoolStatistics;