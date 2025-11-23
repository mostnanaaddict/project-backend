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
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.sites; 
}
function readAdmin() {
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.admin; 
}


function writeSites(sites) {
    // read full json first
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    const json = JSON.parse(data);
    json.sites = sites; 
    fs.writeFileSync(FILE_PATH, JSON.stringify(json, null, 2));
}



//get admin
// --- FIX: Implement filtering logic for the login GET request ---
app.get('/admin', (req, res) => {
    const { username, password } = req.query;

    // If Angular forgets to send username or password → FAIL
    if (!username || !password) {
        return res.json([]);
    }

    const admins = readAdmin(); // <-- returns array

    // strict match
    const match = admins.find(a =>
        a.username === username &&
        a.password === password
    );

    if (match) {
        res.json([match]);   // SUCCESS
    } else {
        res.json([]);        // FAIL
    }
});
// Change admin password
app.put('/admin/password', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  const admins = readAdmin(); // returns array of admins

  // Find the admin
  const admin = admins.find(a => a.username === username && a.password === oldPassword);

  if (!admin) {
    return res.status(400).json({ message: 'Username or old password is incorrect' });
  }

  // Update password
  admin.password = newPassword;

  // Write back to JSON
  const data = fs.readFileSync(FILE_PATH, 'utf-8');
  const json = JSON.parse(data);
  json.admin = admins;
  fs.writeFileSync(FILE_PATH, JSON.stringify(json, null, 2));

  res.json({ message: 'Password updated successfully' });
});


// get da sites
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
  app.post('/sites/:id/comments', (req, res) => {
    let sites = readSites();
    const siteId = req.params.id;
    const site = sites.find(s => s.id === siteId);

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const newComment = {
      commentId: req.body.commentId,          
      author: req.body.author,
      date: req.body.date,
      content: req.body.content,
      rating: req.body.rating
    };

    // Initialize comments array if missing
    site.comments = site.comments || [];
    site.comments.push(newComment);

    // Write updated sites back to JSON
    writeSites(sites);

    res.json(newComment);
  });












//edits the site according to the id wit the formulaire info
app.put('/sites/:id', (req, res) => {
    let sites = readSites();
  const id = req.params.id;
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
  const id = req.params.id;
  sites = sites.filter(s => s.id !== id);
  writeSites(sites);
  res.json({ message: 'Deleted successfully' });
});

app.delete('/sites/:siteId/comments/:commentId',(req,res)=>{
  let sites = readSites();
  const commentId = req.params.commentId ;
  const siteId = req.params.siteId;
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
