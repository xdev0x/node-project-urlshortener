require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoose = require('mongoose');
const { stringify } = require('querystring');

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
});

const urlSchema = new mongoose.Schema({
  short_url: {
    type: String,
    required: true,
    unique: true,
  },
  original_url: {
    type: String,
    required: true
  }
}, {collection: 'url'});

const urlModel = mongoose.model('url', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", function(req, res) {
  try{
    let url = new URL(req.body.url);
    let check = url.protocol === 'http:' || url.protocol === 'https:' ? true : false;
    if(!check){
      return res.json({error: 'invalid url'})
    }
  } catch(e){
    return res.json({error: 'invalid url'})
  }
  urlModel.find().exec().then((urlData) => {
    let original_url = req.body.url;
    let short_url = (urlData.length + 1).toString();
    let url = new urlModel({original_url: original_url, short_url: short_url});
    //console.log('-->>', urlData, urlData.length, url)
    url.save()
      .then((e) => {
        return res.json({ original_url, short_url });
      })
      .catch(err => {
        console.log(err)
        res.json(err);
      });
  })
  .catch((err)=>{
    console.log(err)
    if (err) return res.json(err);
  })
});

app.get("/api/shorturl/:url", function(req, res) {
  urlModel
    .find({ short_url: req.params.url })
    .exec()
    .then(url => {
      console.log("url", url)
      if(url.length > 0){
        res.redirect(url[0]["original_url"]);
      } else {
        return res.json({error: 'invalid url'})
      }
    });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
