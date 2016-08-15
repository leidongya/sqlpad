var Joi = require('joi');
var db = require('../lib/db.js');
var cipher = require('../lib/cipher.js');
var decipher = require('../lib/decipher.js');
var _ = require('lodash');

var schema = {
    _id: Joi.string().optional(), // will be auto-gen by nedb
    name: Joi.string().required(),
    driver: Joi.string().required(), // postgres, mysql, etc
    host: Joi.string().required(),
    port: Joi.any().optional(),
    database: Joi.string().required(),
    username: Joi.string().optional(), // decrypt for presentation, encrypted for storage
    password: Joi.string().optional(), // decrypt for presentation, encrypted for storage
    sqlserverEncrypt: Joi.boolean().default(false, 'SQL Server Encrypt'),
    postgresSsl: Joi.boolean().optional(false, 'Postgres SSL'),
    mysqlInsecureAuth: Joi.boolean().optional(false, 'Mysql Insecure Auth'),
    createdDate: Joi.date().default(new Date(), 'time of creation'),
    modifiedDate: Joi.date().default(new Date(), 'time of modifcation')
}

var Connection = function Connection (data) {
    this._id = data._id;
    this.name = data.name;
    this.driver = data.driver;
    this.host = data.host;
    this.port = data.port;
    this.database = data.database;
    this.username = data.username;
    this.password = data.password;
    this.sqlserverEncrypt = data.sqlserverEncrypt;
    this.postgresSsl = data.postgresSsl;
    this.mysqlInsecureAuth = data.mysqlInsecureAuth;
    this.createdDate = data.createdDate;
    this.modifiedDate = data.modifiedDate;
}

Connection.prototype.save = function ConnectionSave (callback) {
    var self = this;
    this.modifiedDate = new Date();
    // TODO - build in auto cypher if rawUsername and rawPassword set?
    var joiResult = Joi.validate(self, schema);
    if (joiResult.error) return callback(joiResult.error);
    if (self._id) {
        db.connections.update({_id: self._id}, joiResult.value, {}, function (err) {
            if (err) return callback(err);
            Connection.findOneById(self._id, callback);
        });
    } else {
        db.connections.insert(joiResult.value, function (err, newDoc) {
            if (err) return callback(err);
            return callback(null, new Connection(newDoc));
        });
    }
}


/*  Query methods
============================================================================== */

Connection.findOneById = function ConnectionFindOneById (id, callback) {
    db.connections.findOne({_id: id}).exec(function (err, doc) {
        if (err) return callback(err);
        if (!doc) return callback();
        return callback(err, new Connection(doc));
    });
}

Connection.findAll = function ConnectionFindAll (callback) {
    db.connections.find({}).exec(function (err, docs) {
        if (err) return callback(err);
        var connections = docs.map(function (doc) {
            return new Connection(doc);
        });
        connections = _.sortBy(connections, function (c) {
            return c.name.toLowerCase();
        });
        return callback(null, connections);
    })
}

Connection.removeOneById = function ConnectionRemoveOneById (id, callback) {
    db.connections.remove({_id: id}, callback);
}

Connection._removeAll = function _removeAllConnections (callback) {
    db.connections.remove({}, {multi: true}, callback);
}

module.exports = Connection;