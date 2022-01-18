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

    createTransaction({amount, recipient, chain}){

        if(chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }

        if(amount > this.balance){
            throw new Error("Amount exceeds the balance");
        }

        return new Transaction({senderWallet:this, recipient, amount});
    }

    static calculateBalance({chain, address}){

        let hasConductedTransaction = false;
        let outputsTotal = 0;

        for(let i = chain.length-1; i > 0; i--){
            const block = chain[i];

            for(let transaction of block.data){

                if(transaction.input.address === address){
                    hasConductedTransaction = true;
                }

                const addressOutput = transaction.outputMap[address];

                if(addressOutput){
                    outputsTotal = outputsTotal + addressOutput
                }
            }
            if(hasConductedTransaction){
                break;
            }
        }
        return hasConductedTransaction ? outputsTotal : STARTING_VALUE + outputsTotal;
    }
}


module.exports = Wallet;