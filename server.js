const fs = require('fs');
const multer = require('multer');
const path = require('path');


//express is framwork 2 make it easy
const express = require('express');
//alows angular to connect to backend
const cors = require('cors');
//handles requests
const app = express();

app.use(cors());
app.use(express.json());

// ---------- Image Upload Settings ----------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Store uploaded images in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Make uploads publicly accessible
app.use('/uploads', express.static(uploadDir));

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const url = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url });
});



//defines a const to store the data
const FILE_PATH = 'sites.json';

//gets the data from the json file
function readSites() {
  //reads content of site.json synchronously (blocks execution till done) & utf8 returns string instead buffer
  const data = fs.readFileSync(FILE_PATH, 'utf8');
  //converts string into json object
  return JSON.parse(data);
}
//et sites = readSites();

function writeSites(sites) {
  //helps save updates to json file
  //stringify converts js array to json string & 2 is indentation to make json readable
  //it overwrites sites.json wit the new json string
  fs.writeFileSync(FILE_PATH, JSON.stringify(sites, null, 2));
}


//get da sites
app.get('/sites', (req, res) => {
    let sites = readSites();
  res.json(sites);
});

// app.get('/sites/:id', (req,res)=>{
//   const id = parseInt(req.params.id);
//   let sites = readSites();
//   const site = sites.find(s=>s.id===id);
//   res.json(site);
// })

//creates a new site wit the formulaire info
app.post('/sites', (req, res) => {
    let sites = readSites();
  const newSite = { id: Date.now(), ...req.body };
  sites.push(newSite);
  writeSites(sites);
  res.json(newSite);
});

//edits the site according to the id wit the formulaire info
app.put('/sites/:id', (req, res) => {
    let sites = readSites();
  const id = parseInt(req.params.id);
  const index = sites.findIndex(s => s.id === id);
  if (index !== -1) {
    sites[index] = { ...sites[index], ...req.body };
    writeSites(sites);
    res.json(sites[index]);
  } else {
    res.status(404).json({ message: 'Site not found' });
  }
});

//deletes the site according to the id
app.delete('/sites/:id', (req, res) => {
    let sites = readSites();
  const id = parseInt(req.params.id);
  sites = sites.filter(s => s.id !== id);
  writeSites(sites);
  res.json({ message: 'Deleted successfully' });
});

app.delete('/sites/:siteId/comments/:commentId',(req,res)=>{
  let sites = readSites();
  const commentId = parseInt(req.params.commentId);
  const siteId = parseInt(req.params.siteId);
  const site = sites.find(s => s.id === siteId);
  if(!site){return res.status(404).json({message: 'Site not found' });}
  const comment = site.comments.find(c => c.commentId === commentId);
  if(!comment){
    return res.status(404).json({message: 'Comment not found'});}
  site.comments = site.comments.filter(c => c.commentId !== commentId);
  writeSites(sites);
  res.json({ message: 'Deleted comment successfully' });
})


app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
