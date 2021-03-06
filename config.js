const MINE_RATE = 1000;
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: '-------',
    hash: 'hash-one',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
}

const STARTING_VALUE = 1000;

const REWARD_INPUT = { address: '*authorized-reward*' }
const MINING_REWARD = 50;


module.exports = { 
    GENESIS_DATA, 
    MINE_RATE, 
    STARTING_VALUE,
    REWARD_INPUT,
    MINING_REWARD
 }