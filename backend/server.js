require('dotenv').config();
const express 	 = require('express');
const bodyParser = require('body-parser');
const cors 		   = require('cors');
const multer     = require('multer');
const app 	  	 = express();
const cron       = require('node-cron');
const { syncWithTracking, getTrackingToken } = require('./services/EvaluationsHandler.service');

// Sync hours report with tracking every 1st at 1:30am
cron.schedule('30 1 1 * *', () => {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;

  console.log('Syncronizing hours with tracking...');

  getTrackingToken(email, password)
    .then((res) => {
      if(res === 'error') return console.log('---- Syncronizing operation failed ----');
      syncWithTracking(res).then(res => console.log('---- Syncronized successfully! ----'));
    })
    .catch(e => console.log('---- Syncronizing operation failed ----'));
});

// Requiero de manera global la conexión con la base de datos
global.conn  = require('./config/conn');
global.Mdl   = require('./services/middleware.service');


// Router
const usersRouter 	= require('./routes/users');
const coursesRouter = require('./routes/courses');
const resourcesRouter = require('./routes/resources');
const levelsRouter = require('./routes/levels');
const careersRouter = require('./routes/careers');
const technologies = require('./routes/technologies');
const teams = require('./routes/teams');
const Plataforms = require('./routes/Plataforms');
const companies = require('./routes/companies');
const Collaborators = require('./routes/collaborators');
const Hours = require("./routes/hours");
const Payment = require("./routes/payments");
const externalRelations = require("./routes/externalRelationsCompanies")
const burnoutTestRouter = require("./routes/burnoutTests")

const port 	  	 = process.env.API_PORT;
const seed       = 100000000000000

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    // Generar nombre aleatorio al archivo con su extensión
    let oldnameArr = file.originalname.split('.')
    let format     = oldnameArr[1]
    let name       = Math.round(Math.random()*seed) + '_image_.' + format
    cb(null, name)
  }
})
const upload = multer({ storage: storage })

app.use(express.static(__dirname + '/public'));
app.use(cors())
app.use(bodyParser.json())

app.get('/', function (req, res) {
	let response = {hola: "Mundo"}

	res.set(['Content-Type', 'application/json']);
    res.send(response);
})

app.use('/users', usersRouter)
app.use('/courses', coursesRouter)
app.use('/resources', resourcesRouter)
app.use('/careers', careersRouter)
app.use('/levels', levelsRouter)
app.use('/technologies', technologies)
app.use('/teams', teams)
app.use('/plataforms', Plataforms)
app.use('/companies', companies)
app.use('/collaborators', Collaborators)
app.use('/hours', Hours)
app.use('/payments', Payment)
app.use('/public', express.static('public'));
app.use('/external/relations', externalRelations);
app.use('/burnout_tests', burnoutTestRouter)

app.post('/upload-file', upload.single('file-image'), function (req, res, next) {
  // req.file is the `profile-file` file
  // req.body will hold the text fields, if there were any
  // console.log(JSON.stringify(req.file))
  return res.send({response: {url: req.file.path}})
})

module.exports = app;