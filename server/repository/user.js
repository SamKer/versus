const
    Entity = require('../entity/users'),
    uuid = require('uuid')
;

const UserRepo =  {



    /**
     * Recherche une entrée spécifique
     * @returns {Promise<void>}
     */
    auth: async (login, password) => {
        return await Entity.find({login: login, password: password}).exec();
    },


    /**
     * Cherche un utilisateur
     * @param login
     * @returns {Promise<*>}
     */
    find: async (login, type) => {
        return await Entity.findOne({login:login, type:type}).exec();
    },


    /**
     * insère une nouvelle application
     * @param {String} id package id
     * @param {name}
     * @returns {Promise<void>}
     */
    new: async (login, role) => {
        let password = uuid.v1().split('-')[4];
        let e = new Entity({
            login: login,
            password: password,
            role: role
        });
        return await Entity.create(e.toObject());
    },


};


module.exports = UserRepo;