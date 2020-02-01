let express = require( 'express' );
let morgan = require( 'morgan' );
let bodyParser = require( 'body-parser' );
let mongoose = require( 'mongoose' );
let jsonParser = bodyParser.json();
let { StudentList, CareerList } = require( './model' );
let jwt = require( 'jsonwebtoken' );
let {DATABASE_URL, PORT} = require( './config' );

let app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    if (req.method === "OPTIONS") {
      return res.send(204);
    }
    next();
  });

app.use( express.static( 'public' ));
app.use( morgan( 'dev' ) );

let estudiantes = [{
    nombre : "Miguel",
    apellido : "Ángeles",
    matricula : 1730939
},
{
    nombre : "Erick",
    apellido : "González",
    matricula : 1039859
},
{
    nombre : "Victor",
    apellido : "Villarreal",
    matricula : 1039863
},
{
   nombre : "Victor",
   apellido : "Cárdenas",
   matricula : 816350 
}];

app.get( '/api/students', jsonParser, ( req, res ) => {
    console.log( req.body);
    StudentList.getAll()
        .then( studentList => {
            return res.status( 200 ).json( studentList );
        })
        .catch( error => {
            console.log(error);
            res.statusMessage = "Hubo un error de conexion con la BD."
            return res.status( 500 ).send();
        });
});

app.get( '/api/getById', ( req, res ) => {
    let id = req.query.id;

    let result = estudiantes.find( ( elemento ) => {
        if ( elemento.matricula == id ){
            return elemento;
        }
    });

    if( result ){
        return res.status( 200 ).json( result );
    }
    else{
        res.statusMessage = "El alumno no se encuentra en la lista.";
        return res.status( 404 ).send();
    }

});

app.get( '/api/getByName/:name', ( req, res ) => {
    let name = req.params.name;

    let result = estudiantes.filter( ( elemento ) => {
        if ( elemento.nombre === name ){
            return elemento;
        }
    });

    if( result.length > 0 ){
        return res.status( 200 ).json( result );
    }
    else{
        res.statusMessage = "El alumno no se encuentra en la lista.";
        return res.status( 404 ).send();
    }
});

app.post( '/api/newStudent', jsonParser, ( req, res ) =>{
    
    let nombre = req.body.nombre;
	let apellido = req.body.apellido;
    let matricula = req.body.matricula;
    let clave = req.body.clave;

	let newStudent = {
		nombre,
		apellido,
		matricula
	};

    CareerList.getIdByKey( clave )
        .then( carrera => {

            newStudent.carrera = carrera._id;
            StudentList.create( newStudent, )
                .then( student => {
                    return res.status( 201 ).json( student );
                })
                .catch( error => {
                    res.statusMessage = "Error en conexión con la base de datos";
                    return res.status( 500 ).json( error );
                });
        })
        .catch( error => {
            console.log(error);
            res.statusMessage = "Hubo un error de conexion con la BD. " + error;
            return res.status( 500 ).send();
        });

	
});

app.post( '/api/login', jsonParser, ( req, res ) => {

    let user = req.body.user;
    let password = req.body.password;
    //Validar el usuario en la BD antes de generar el token
    let data = {
        user
    };

    let token = jwt.sign( data, ' ', {
        expiresIn : 60 * 5
    });

    return res.status( 200 ).json( {token} );

});

app.get( '/api/validate', ( req, res ) => {
    let token = req.headers.authorization;
    token = token.replace('Bearer ', '');

    jwt.verify( token, 'secret', ( err, user ) => {
        if ( err ){
            res.statusMessage = "Token no valido";
            return res.status (400 ).send();
        }

        console.log( user );
        return res.status( 200 ).json( { message : "Exito" } );
    });
});

app.get( '/api/careers', ( req, res ) => {
    CareerList.getAll()
        .then( careerList => {
            return res.status( 200 ).json( careerList );
        })
        .catch( error => {
            console.log(error);
            res.statusMessage = "Hubo un error de conexion con la BD."
            return res.status( 500 ).send();
        });
});

app.post( '/api/newCareer', jsonParser, ( req, res ) =>{
    
    let nombre = req.body.nombre;
	let clave = req.body.clave;

	let newCareer = {
		nombre,
		clave
	};

	CareerList.create( newCareer )
		.then( career => {
			return res.status( 201 ).json( career );
		})
		.catch( error => {
			res.statusMessage = "Error en conexión con la base de datos";
			return res.status( 500 ).json( error );
		});
});

app.get( '/api/getStudentsByCareer/:key', ( req, res ) => {
    let clave = req.params.key;

    CareerList.getIdByKey( clave )
        .then( carrera => {
;
            StudentList.getByCareer( carrera._id )
                .then( students => {
                    return res.status( 200 ).json( students );
                })
                .catch( error => {
                    res.statusMessage = "Error en conexión con la base de datos";
                    return res.status( 500 ).json( error );
                });
        })
        .catch( error => {
            console.log(error);
            res.statusMessage = "Hubo un error de conexion con la BD. " + error;
            return res.status( 500 ).send();
        });
});

let server;

function runServer(port, databaseUrl){
	return new Promise( (resolve, reject ) => {
		mongoose.connect(databaseUrl, response => {
			if ( response ){
				return reject(response);
			}
			else{
				server = app.listen(port, () => {
					console.log( "App is running on port " + port );
					resolve();
				})
				.on( 'error', err => {
					mongoose.disconnect();
					return reject(err);
				})
			}
		});
	});
}

function closeServer(){
	return mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('Closing the server');
				server.close( err => {
					if (err){
						return reject(err);
					}
					else{
						resolve();
					}
				});
			});
		});
}
runServer( PORT, DATABASE_URL );

module.exports = { app, runServer, closeServer }