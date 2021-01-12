const mongoose = require("mongoose"),
    Schema = mongoose.Schema;


const SCHEMA_USERS = "users";

// creation du schema pour neomqtt
const mqttSchema = new Schema({
    login: String,
    password: String,
    role: String,
    type: String
}, {
    collection: SCHEMA_USERS,
    strict: false
});


// Create a model using schema
const UserEntity = mongoose.model(SCHEMA_USERS, mqttSchema);

// make this model available
module.exports = UserEntity;