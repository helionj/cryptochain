const Blockchain = require('../blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({data: 'initial'});

let prevsTimestamp, nextTimestamp, nextBlock, timeDiff, average;
const times = [];

for(let i = 0; i<1000; i++){
    prevsTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;

    blockchain.addBlock({data: `block: ${i}`});

    nextBlock = blockchain.chain[blockchain.chain.length - 1];
    nextTimestamp = nextBlock.timestamp;

    timeDiff = nextTimestamp - prevsTimestamp;
    times.push(timeDiff);

    average = times.reduce((total, num) => (total+num))/times.length;

    console.log(`Time to mine block: ${timeDiff} ms, Difficulty: ${nextBlock.difficulty},  Average: ${average} ms`);

}