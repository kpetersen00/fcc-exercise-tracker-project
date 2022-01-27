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
  exercises: Array,
});
const User = mongoose.model('User', userSchema);
// add user
app.use('/api/users', bodyParser.urlencoded({ extended: false }));
app.post('/api/users', (req, res) => {
  const { username: user } = req.body;
  let newUser = new User({ username: user });
  newUser.save();
  res.json({ username: user, id: newUser._id });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
