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
const candidatesRouter = require("./routes/candidates")
const partnersRoutes = require('./routes/partners')

const port = process.env.API_PORT;
const seed = 100000000000000;

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname.toLowerCase();
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file type'), null);
    }

    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * seed);
    const safeName = `${timestamp}_${randomNum}_file${fileExtension}`;

    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  },
  fileFilter: function (req, file, cb) {
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }

    // Additional filename validation
    const originalName = file.originalname.toLowerCase();
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension.'), false);
    }

    // Check for suspicious filenames
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      return cb(new Error('Invalid filename.'), false);
    }

    cb(null, true);
  }
});

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
app.use('/candidates', candidatesRouter)
app.use('/partners', partnersRoutes)

app.post('/upload-file', (req, res, next) => {
  upload.single('file-image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum is 1 file.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field name.' });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    } else if (err) {
      // Handle other errors (like file type validation)
      return res.status(400).json({ error: err.message });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    // Success response
    return res.json({
      response: {
        url: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  });
});

module.exports = app;
