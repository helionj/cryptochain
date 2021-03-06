const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require("../config");
const { cryptoHash } = require('../util');

class Block{
    constructor({timestamp, nonce, difficulty, lastHash, hash, data}){
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static genesis(){
        return new this(GENESIS_DATA);
    }

    static mineBlock({lastBlock, data}){
        
        let hash, timestamp, difficulty;

        const lastHash = lastBlock.hash;

        let nonce = 0;
      
        do {
            timestamp = Date.now();
            difficulty = this.adjustDifficulty({originalBlock: lastBlock, timestamp});
            nonce++;
            hash = cryptoHash(timestamp, lastBlock.hash, data, nonce, difficulty);
           
        }while(hexToBinary(hash).substring('0', difficulty) !== ('0'.repeat(difficulty)));
       
        return new this(
            {
                timestamp, 
                lastHash, 
                hash, 
                data,
                difficulty,
                nonce
            }
        );
    }

    static adjustDifficulty({originalBlock, timestamp}){
        const { difficulty } = originalBlock;

        if(difficulty < 1) return 1;
        if((timestamp - originalBlock.timestamp) > MINE_RATE) return difficulty - 1;
    
        return difficulty + 1;
    }
}

module.exports = Block;