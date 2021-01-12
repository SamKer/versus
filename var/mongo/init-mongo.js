db.createUser(
    {
        user: "versus",
        pwd: "readyfight",
        roles: [
            {
                role: "readWrite",
                db: "versus"
            }
        ]
    }
);
db.getSiblingDB('versus');
db.users.insert({
    login: 'ken',
    password: 'hokutonoken',
    role: 'admin',
    type: 'basic'
});
db.users.insert({
    login: 'ryu',
    password: 'seijurohiko',
    role: 'admin',
    type: 'basic'
});
