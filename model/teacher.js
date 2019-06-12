const mongoose = require('mongoose');
const mdbURL = 'mongodb+srv://admin:admin@cluster0-dp1yr.mongodb.net/trainee-prominas?retryWrites=true';
mongoose.connect(mdbURL, { useNewUrlParser: true });

const teacherSchema = require('./schema').teacherSchema;
const Teacher = mongoose.model('Teacher', teacherSchema, 'teacher');

const courseModel = require('./course');
const studentModel = require('./student');

var id;
Teacher.countDocuments({}, (err, count) => {
	id = count;
});

exports.getAll = (res, query, projection) => {
	return Teacher.find(query, projection)
	.then(teachers => {
		if(teachers.length > 0){
			res.status(200).send(teachers);        
		}else{
			res.status(404).send('Nenhum professor cadastrado');
		}
	})
	.catch(err => {
		console.error("Erro ao conectar a collection teacher: ", err);
		res.status(500);
	});
};

exports.getFiltered = (res, query, projection) => {
	return Teacher.find(query, projection)
	.then(teacher => {
		if(teacher.length > 0){
			res.status(200).send(teacher);        
		}else{
			res.status(404).send('O professor não foi encontrado');
		}
	})
	.catch(err => {
		console.error("Erro ao conectar a collection teacher: ", err);
		res.status(500);
	});
};

exports.post = (req, res) => {
	let teacher = new Teacher({id: ++id, name: req.body.name, lastName: req.body.lastName, phd: req.body.phd, status: 1});
	teacher.validate(error => {
		if(!error){
			return Teacher.create(teacher) 
			.then(result => {
				res.status(201).send('Professor cadastrado com sucesso!');
			})
			.catch(err => {
				console.error("Erro ao conectar a collection teacher: ", err);
				res.status(500);
			});
		}else{
			id--;
			res.status(401).json({
				message: 'Não foi possível cadastrar o professor', 
				error: error.errors.phd.message
			});
		}
	}) 
};

exports.put = (req, res, query) => {
	let teacher = ({id:parseInt(req.params.id), name: req.body.name, lastName: req.body.lastName, phd: req.body.phd, status: 1});
	let validate = new Teacher(teacher);

	validate.validate(error =>{
		if(!error){
			return Teacher.findOneAndUpdate(query, {$set: teacher}, {returnOriginal:false})
			.then(async (result) => {
				if(result){ // if professor exists
					res.status(200).send('Professor editado com sucesso!');
					//  updates the course that contains this teacher
					await courseModel.updateTeacher(parseInt(req.params.id), result);
					// receives the updated teacher and updates the student that contains this teacher
					courseModel.getCoursebyTeacher().then(courses => {
						for(var i = 0; i<courses.length; i++){
							studentModel.updateTeacher(courses[i]);
						}
					});
				}else{
					res.status(401).send('Não é possível editar professor inexistente');
				}
			})
			.catch(err => {
					console.error("Erro ao conectar a collection teacher: ", err);
					res.status(500);
			});
		}else{
			res.status(401).json({
				message: 'Não foi possível editar o professor', 
				error: error.errors.phd.message
			});
		}
	})
};

exports.delete = (req, res, query) => {
	return Teacher.findOneAndUpdate(query, {$set: {status:0}})
	.then(async (result) => {
		//  updates the course that contains that teacher
		await courseModel.deleteTeacher(parseInt(req.params.id));
		
		// receives the updated teacher and updates the student that contains this teacher
		courseModel.getCoursebyTeacher().then(courses => {
			for(var i = 0; i<courses.length; i++){
				studentModel.updateTeacher(courses[i]);
			}
		});
		
		if(result){ // if professor exists
			console.log('O professor foi removido');
			res.status(200).send('O professor foi removido com sucesso');
		}else{
			console.log('Nenhum professor foi removido');
			res.status(204).send();
		}
	})
	.catch(err => {
		console.error("Erro ao conectar a collection teacher: ", err);
		res.status(500);
	});
};

exports.getTeacher = (id) => {
	return Teacher.find({'id':id, 'status':1});
};

exports.jsonAll = (res, query, projection) => {
	return Teacher.find(query, projection)
	.then(teachers => {
		if(teachers.length > 0){ 
			res.json(teachers);        
		}else{
			res.status(404).json();
		}
	})
	.catch(err => {
		console.error("Erro ao conectar a collection teacher: ", err);
		res.status(500);
	});
};

exports.jsonFiltered = (res, query, projection) => {
	return Teacher.find(query, projection)
	.then(teacher => {
		if(teacher.length > 0){
			res.json(teacher);        
		}else{
			res.status(404).json();
		}
	})
	.catch(err => {
		console.error("Erro ao conectar a collection teacher: ", err);
		res.status(500);
	});
};