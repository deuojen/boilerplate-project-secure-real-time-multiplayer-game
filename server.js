require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const nocache = require('nocache');

// complete game https://secure-real-time-multiplayer-game.freecodecamp.rocks/

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();
const helmet = require('helmet');

const server = require('http').createServer(app);

app.use(
  helmet({
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: {
      setTo: 'PHP 7.4.3',
    },
  })
);
app.use(nocache());
// deprecated but added for test to pass
app.use(helmet.noCache());

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({ origin: '*' }));

// Index page (static HTML)
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket.listen(server);
const Collectible = require('./public/Collectible.mjs');
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

let players = [];
let baitNum = 0;
let bait;

io.on('connection', (socket) => {
  // on player connect
  socket.on('start', (player) => {
    console.log('player has joined', player);
    players.push(player);

    // send player info
    socket.emit('player_updates', players);

    // create a bait
    bait = createBait(baitNum);
    socket.emit('bait', bait);
  });

  //  on player collision
  socket.on('collision', (player) => {
    for (let p of players) {
      if (p.id === player.id) {
        p.score += bait.value;
      }
    }
    // update bait
    bait = createBait(baitNum);
    socket.emit('bait', bait);
  });
});

// create a new collectible
function createBait(id) {
  let random_x, random_y;
  random_x = Math.floor(Math.random() * (CANVAS_WIDTH - 20)) + 20;
  random_y = Math.floor(Math.random() * (CANVAS_HEIGHT - 20)) + 20;
  random_value = Math.floor(Math.random() * 5) + 1;
  baitNum += 1;
  return new Collectible({
    x: random_x,
    y: random_y,
    value: random_value,
    id: id,
  });
}

module.exports = app; // For testing
