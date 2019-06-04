const mongoClient = require('mongodb').MongoClient;
const mdbURL = 'mongodb+srv://admin:admin@cluster0-dp1yr.mongodb.net/test?retryWrites=true';

var db;
var collection;
var id;
mongoClient.connect(mdbURL, {useNewUrlParser:true}, (err, database) => {
    if(err){
        console.error('Ocorreu um erro ao conectar ao mongoDB' + err);
        send.status(500);
    }else{
        db = database.db('trainee-prominas');
        collection = db.collection('user');
        collection.find({}).toArray((err, user) =>{id = user.length});
    }
});

exports.getAll = (query, projection) => {
    return collection.find(query, projection).toArray();
};

exports.getFiltered = (query, projection) => {
    return collection.find(query, projection).toArray();
}

exports.post = (user) => {
    user.id = ++id;
    return collection.insertOne(user);
}

exports.put = (query, set) => {
    return collection.findOneAndUpdate(query, set);
}

exports.delete = (query, set) => {
    return collection.findOneAndUpdate(query, set);
}