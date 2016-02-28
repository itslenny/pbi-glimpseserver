function Db(host, key) {
    if(!host || !key) throw new Error("Invalid database configuration.");
    DoQmentDB  = require('doqmentdb');
    var DocumentClient = require('documentdb').DocumentClient;
    var connection = new DocumentClient(host, {masterKey: key});
    this.db = new DoQmentDB(connection, 'GlimpseData');
}

Db.prototype.add = function(key, data) {
        var collection = this.db.use('glimpse_' + key.replace(/\W+/g, "_"));
        return collection.create(data);
}

module.exports = Db;