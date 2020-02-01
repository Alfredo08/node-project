let mongoose = require( 'mongoose' );

mongoose.Promise = global.Promise;

let studentCollection = mongoose.Schema({
    nombre : { type : String },
    apellido : { type: String },
    matricula : {
        type: Number,
        required : true,
        unique : true
    },
    carrera : { type: mongoose.Schema.Types.ObjectId, ref: 'careers' }
});

let careerCollection = mongoose.Schema({
    nombre : { type : String },
    clave : { 
        type : String,
        required: true,
        unique : true
    }
});

let Student = mongoose.model( 'students', studentCollection );
let Career = mongoose.model( 'careers', careerCollection );

let StudentList = {
    getAll : function(){
        return Student.find()
            .then( students => {
                return students;
            })
            .catch( error => {
                throw Error( error );
            });
    },
    create : function( newStudent ){
		return Student.create( newStudent )
				.then( student => {
					return student;
				})
				.catch( error => {
					throw Error(error);
				});
    },
    getByCareer : function( careerID ){
        return Student.find( { carrera : careerID })
            .populate('carrera')
            .then( students => {
                return students;
            })
            .catch( error => {
                throw Error(error);
            });
    }
};

let CareerList = {
    getAll : function(){
        return Career.find()
            .then( careers => {
                return careers;
            })
            .catch( error => {
                throw Error( error );
            });
    },
    create : function( newCareer ){
		return Career.create( newCareer )
				.then( career => {
					return career;
				})
				.catch( error => {
					throw Error( error );
				});
    },
    getIdByKey : function( key ){
        return Career.findOne( { clave : key } )
            .then( career => {
                if( career ){
                    return career;
                }
                
                throw new Error( 'Career not found' );
            })
            .catch( err => {
                throw Error( err );
            })
    }
}

module.exports = {
    StudentList,
    CareerList
};
