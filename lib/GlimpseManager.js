function GlimpseManager(db) {
    this.glimpses = {};
    this.db = db;
}

GlimpseManager.prototype.set = function(name, data) {
    return this.glimpses[name] = new Glimpse(data, this.db);
}

GlimpseManager.prototype.get = function(name) {
    return this.glimpses[name];
}

GlimpseManager.prototype.exists = function(name) {
    return !!this.glimpses[name];
}

GlimpseManager.prototype.delete = function(name) {
    this.glimpses[name] = undefined;
}

function Glimpse(data, db) {
    for(var key in data) {
        this[key] = data[key];
    }
    this.db = db;
}

Glimpse.prototype.connected = function() {
    return !!this.socketId;
}

Glimpse.prototype.persist = function(event, data, time) {
    if(this.persistEvents && Array.isArray(this.persistEvents[event])) {
        var persistEvents = this.persistEvents[event];
        var persistData = {};
        var count = 0;
        for(var i = 0; i < persistEvents.length; i++) {
            if(typeof data[persistEvents[i]] !== 'undefined') {
                persistData[event + '.' + persistEvents[i]] = data[persistEvents[i]];
                count++;
            }
        }
        if(count > 0){
            persistData._time = time;
            return this.db.add(this.id, persistData);    
        }
    } else {
        //todo: return bluebird promise and resolve
    }
}

module.exports = GlimpseManager;