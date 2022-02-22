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
});
const exerciseSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      default: new Date().toDateString(),
    },
  },
  { versionKey: false }
);
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
// add user
app.post(
  '/api/users',
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
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
  }
);
// request list of all users
app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if (!err) {
      res.json(data);
    }
  });
});
// submit exercises
app.post(
  '/api/users/:_id/exercises',
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    const uid = req.body[':_id'] || req.params._id;
    const { description, date, duration } = req.body;
    console.log(req.body);
    if (!uid || !description || !duration) {
      res.json({ error: 'missing requirements' });
      return;
    }
    User.findOne({ _id: uid }, (err, foundUser) => {
      if (err) {
        res.json({ error: 'invalid id' });
        return;
      }
      if (!foundUser) {
        res.json('unknown userID');
        return;
      } else {
        const user = foundUser.username;
        const newExercise = new Exercise({
          username: user,
          description: description,
          duration: duration,
        });
        if (date) {
          newExercise.date = new Date(date.replace(/-/g, '/')).toDateString();
        }
        newExercise.save((err, data) => {
          if (err) {
            return console.log(err);
          }
          const responseObj = {
            _id: uid,
            username: data.username,
            date: data.date,
            duration: data.duration,
            description: data.description,
          };
          console.log(responseObj);
          res.json(responseObj);
        });
      }
    });
  }
);
// get request for exercise logs
app.get('/api/users/:id/logs', (req, res) => {
  // console.log(req.query);
  let responseObj = {};
  let from, to, limit;
  if (req.query.from) {
    from = new Date(req.query.from).toDateString();
  }
  if (req.query.to) {
    to = new Date(req.query.to).toDateString();
  }
  if (req.query.limit) {
    limit = req.query.limit;
  }
  id = req.params.id;
  User.findById(id, (err, data) => {
    if (err) return console.log(err);
    // console.log(data);
    if (data) {
      Exercise.find(
        { username: data.username },
        { _id: 0, username: 0, __v: 0 }
      )
        .limit(limit)
        .exec((err, log) => {
          // console.log(log);
          const exerciseLogs = log;
          responseObj = {
            _id: id,
            username: data.username,
            count: exerciseLogs.length,
            log: exerciseLogs,
          };
          res.json({
            _id: id,
            username: data.username,
            from: from,
            to: to,
            count: exerciseLogs.length,
            log: exerciseLogs,
          });
        });
    }
  });
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
