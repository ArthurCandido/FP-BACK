const Cryptr = require('cryptr');

const cryptr = new Cryptr('myTotallySecretKey');
const JWT_SECRET = 'your_jwt_secret';
let invalidTokens = [];

module.exports = {cryptr, JWT_SECRET, invalidTokens};