const { STARTING_VALUE } = require("../config");
const { ec, cryptoHash } = require("../util");
const Transaction = require('./transaction');


class Wallet{

    constructor(){
        this.keyPair = ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic().encode('hex');

        this.balance = STARTING_VALUE;
    }

    sign(data){
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({amount, recipient}){
        if(amount > this.balance){
            throw new Error("Amount exceeds the balance");
        }
        return new Transaction({senderWallet:this, recipient, amount});
    }
}


module.exports = Wallet;