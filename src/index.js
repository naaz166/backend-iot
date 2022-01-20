/// importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');

const { ProfileForm } = require('../models/profileForm');
const { User } = require('../models/user');
//const { Router } = require('express');
const { path } = require('express/lib/application');
const multer = require("multer");
const fs = require("fs");

//app.use(express.static(__dirname+"./public/"));


mongoose.connect('mongodb+srv://hogteam:h0gteam@clusterhog.rg30t.mongodb.net/finalteamproject?retryWrites=true&w=majority');
const port = process.env.PORT || 3001
// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));


app.post('/auth', async (req,res) => {
  const user = await User.findOne({ username: req.body.username })
  console.log(req.body.username)
  console.log(req.body.password)
  if(!user) {
    return res.sendStatus(401);
  }
  if( req.body.password !== user.password ){
    return res.sendStatus(403)
  }

  user.token = uuidv4()
  await user.save()
  res.send({token: user.token,role:user.role})

})


app.get("/user/pic/:filename", (req,res) => {
  try
  {
    var path = require("path")
 // console.log("Got Here",__dirname + '/uploads/' + req.params.filename)
 res.sendFile(path.resolve('./uploads/' + req.params.filename))
  }
  catch(err){
    console.log(err)
  }
 //res.end()

})
{/*var storage = multer.diskStorage({
 destination: function (req, file, cb) {
   cb(null, './uploads/')
 },
 filename: function (req, file, cb) {
   cb(null, Date.now()+file.originalname )
 }
});

const fileFilter=(req, file, cb)=>{
if(file.mimetype ==='image/jpeg' || file.mimetype ==='image/jpg' || file.mimetype ==='image/png'){
    cb(null,true);
}else{
    cb(null, false);
}

}

var upload = multer({ 
 storage:storage,
 limits:{
     fileSize: 1024 * 1024 * 5
 },
 fileFilter:fileFilter
});*/}


app.use( async (req,res,next) => {
  const authHeader = req.headers['authorization']
  const user = await User.findOne({token: authHeader})
  if(user) {
    next()
  }else {
    res.sendStatus(403);
  }
})



// defining CRUD operations

var storage = multer.memoryStorage();
  var uploadDisk = multer({ storage: storage });


   app.post("/user/new", uploadDisk.single('myFile'), async (req,res) =>{
    var savedFilename = './uploads/' + Date.now() + req.file.originalname;
    fs.writeFileSync(savedFilename, req.file.buffer)
    
  console.log(req.body)
  //console.log(req.files.myFile);
//req.files.myFile
    res.json({filename: savedFilename})
   })

  
   

app.post('/', async (req, res) => {
  const authHeader = req.headers['authorization']
  const user = await User.findOne({token: authHeader})
  
  const newProfileForm = req.body;
  const profileForm = new ProfileForm(newProfileForm);
  
  await profileForm.save();
  res.send({ message: 'New profile information added.' });
});
app.get('/', async (req, res) => {
  res.send(await ProfileForm.find());
});


app.delete('/:id', async (req, res) => {
  await ProfileForm.deleteOne({ _id: ObjectId(req.params.id) })
  res.send({ message: 'Profile removed.' });
});

app.put('/:id', async (req, res) => {
  await ProfileForm.findOneAndUpdate({ _id: ObjectId(req.params.id)}, req.body )
  res.send({ message: 'Profile information updated .' });
});

app.post('/tda/search', async (req, res) => {
  const { sEmail, sFullname, sCourse, dateMin, dateMax } = req.body
  const query = {}
  if (sFullname) {
    query.fullname = sFullname
  }
  if (sEmail){
    query.email = sEmail
  }
  if(sCourse){
    query.course = sCourse
  }
  if (dateMin){
    query.date = { $gte: dateMin }
  }
  if (dateMax) {
  query.date.$lte = dateMax
  }
  if (!dateMax && dateMin){
    query.date={$eq:dateMin}
  }
  res.send(await ProfileForm.find(query).lean())
})

{/*app.post("/update-profile/",upload.single('profileImage'),function(req,res,next){

  var id=req.body.user_id;
   var profilePic= req.file.path;
   userModel.findById(id,function(err,data){

    data.profileImage=profilePic?profilePic:data.profileImage;
   
      data.save()
        .then(doc=>{
           res.status(201).json({
               message:"Profile Image Updated Successfully",
               results:doc
           });
        })
        .catch(err=>{
            res.json(err);
        })
       
   });

});*/}






app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
  console.log("Database connected!")
});
