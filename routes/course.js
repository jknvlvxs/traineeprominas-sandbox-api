const express = require('express');
const router = express.Router();

const mongoClient = require('mongodb').MongoClient;
const mdbURL = 'mongodb+srv://admin:admin@cluster0-dp1yr.mongodb.net/test?retryWrites=true';
var db;
var collection;
var collectionTeacher;

var id;

// CONEXÃO AO MONGODB
mongoClient.connect(mdbURL, {useNewUrlParser:true}, (err, database) => {
  if(err){
    console.error('Ocorreu um erro ao conectar ao mongoDB');
    send.status(500); //INTERNAL SERVER ERROR
  }else{
    db = database.db('trainee-prominas');
    collection = db.collection('course');
    collectionTeacher = db.collection('teacher');
    collection.find({}).toArray((err, user) =>{id = user.length + 1});
  }
});

// CRUD COURSE COMPLETED

// CREATE COURSE
router.post('/', function(req, res){
  var wrongInsert = [];
  let teacher;
  if (req.body.name && req.body.city){
    var course = {};
    course.id = id++;
    course.name = req.body.name;
    course.period = req.body.period || 8;
    course.city = req.body.city;
    course.teacher = req.body.teacher;
    course.status = 1;
    (async () => {
      for(let i = course.teacher.length-1; i > -1 ; i--){
        teacher = await _getOneTeacher(course.teacher[i]);
        if(teacher == null){
          wrongInsert.unshift(course.teacher[i]);
          course.teacher.splice(i, 1);
         }else{
          course.teacher[i] = teacher; 
         }
      }
      if(course.teacher.length == 0){
        delete course.teacher;
      }
      
      collection.insertOne(course, (err, result) => {
        if(err){
          console.error('Ocorreu um erro ao conectar a collection teacher');
          res.status(500).send('Erro ao cadastrar curso');
        }else{
          if(course.teacher.length > 0){
              res.status(201).send('Curso cadastrado com sucesso!');            
          }else{
            if(wrongInsert.length == 0){
              res.status(201).send('O curso foi cadastrado com o sucesso, porém não lhe foi atribuído nenhum professor');
            }else{
                  res.status(201).send('O curso foi cadastrado com o sucesso, porém o(s) professor(s) ' + wrongInsert+ ' não existe(m)');
            }
          }
        }
      });
    })();
  }  
});
  
// READ ALL COURSES
router.get('/', function (req, res){
  collection.find({"status":1}, {projection: {_id:0, id: 1, name: 1, period: 1, city:1, teacher:1}}).toArray((err, courses) =>{
    if(err){
      console.error('Ocorreu um erro ao conectar a collection course');
      send.status(500);
    }else{
      res.send(courses);
    }
  });
});

router.delete('/', function (req, res){
  collection.remove();
});

// READ COURSES FILTERED
router.get('/:id', function (req, res){
  collection.find({"id": parseInt(req.params.id), "status":1}, {projection: {_id:0, id: 1, name: 1, period: 1, city:1, "teacher.name":0}}).toArray((err, course) =>{
    if(err){
      console.error('Ocorreu um erro ao conectar a collection course');
      res.status(500);
    }else{
      if(course === []){
        res.status(404).send('Curso não encontrado');
      }else{
        res.send(course);        
      }
    }
  });
});
  
// UPDATE COURSE  
router.put('/:id', function (req, res){
  var id = req.params.id;
  var course = req.body;
  course.id = parseInt(id);
  if(course === {}){
    res.status(400).send('Solicitação não autorizada');
  }else{
    (async () => {
      for(let i = 0; i < course.teacher.length; i++){
        let teacher = await _getOneTeacher(course.teacher[i]);
        if(teacher == null){
         course.teacher.splice(i, 1);
         }else{
          course.teacher[i] = teacher; 
         }
      }
      collection.update({"id": parseInt(id)}, course, (err, result) => {
        if(err){
          console.error("Ocorreu um erro ao conectar a collection teacher");
          res.status(500).send("Erro ao editar curso");
        }else{
          res.status(201).send("Curso editado com sucesso!");            
        }
      });
    })();
  }
});

// DELETE COURSES FILTERED
router.delete('/:id', function (req, res){ //DELETE FILTERED
  var id = parseInt(req.params.id);
  collection.deleteOne({"id": id}, true, function (err, info){
    if(err){
      console.error('Ocorreu um erro ao deletar os cursos da coleção');
      res.status(500);
    }else{
      var numRemoved = info.result.n;
      if(numRemoved > 0){
        console.log('O curso foi removido com sucesso');
        // res.status(204) // no content
        res.send('O curso foi removido com sucesso'); 
      }else{
        console.log('Nenhum curso foi removido');
        res.status(404).send('Nenhum cursos foi removido');
      }
    }
  });
});

const _getOneTeacher = (idTeacher) => {
  return new Promise((resolve, reject) => {
    collectionTeacher.findOne({"id": parseInt(idTeacher), "status": 1}, (err, teacher) =>{
      if(err){
        reject(err);
      }else{
        resolve(teacher);
      }
    });
  });
};

module.exports = router;