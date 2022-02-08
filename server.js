const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const { Schema } = require('mongoose');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
// db schema
const userSchema = new Schema({
  username: { type: String, required: true },
  log: Array,
});
const User = mongoose.model('User', userSchema);
// add user
app.use('/api/users', bodyParser.urlencoded({ extended: false }));
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  User.findOneAndUpdate(
    { username: username },
    { username: username },
    { new: true, upsert: true },
    (err, data) => {
      if (!err) {
        res.json({ username: data.username, _id: data._id });
      }
    }
  );
});
// request list of all users
app.get('/api/users', (req, res) => {
  User.find({})
    .select({ log: 0 })
    .exec((err, data) => {
      if (!err) {
        res.json(data);
      }
    });
});
// submit exercises
app.use(
  '/api/users/:_id/exercises',
  bodyParser.urlencoded({ extended: false })
);
app.post('/api/users/:_id/exercises', (req, res) => {
  const { uid, description, date, duration } = req.body;
  let formattedDate;
  if (date !== '') {
    formattedDate = new Date(date).toDateString();
  } else {
    formattedDate = new Date().toDateString();
  }
  User.findByIdAndUpdate(
    uid,
    {
      $push: {
        log: {
          description: description,
          duration: duration,
          date: formattedDate,
        },
      },
    },
    (err, data) => {
      if (!err) {
        data.log.push({
          description: description,
          duration: duration,
          date: formattedDate,
        });
        res.json({
          username: data.username,
          description: description,
          duration: duration,
          date: formattedDate,
          _id: uid,
        });
      }
      if (err) {
        console.log(err);
      }
    }
  );
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
