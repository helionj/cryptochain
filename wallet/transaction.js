const uuid = require('uuid');
const { verifySignature } = require('../util')
class Transaction {

    constructor({ senderWallet,recipient,amount }){
        
        this.id = uuid.v1();
        this.amount = amount;
        this.outputMap = this.createOutputMap({senderWallet, recipient, amount});
        this.input = this.createInput({senderWallet, outputMap: this.outputMap});
    }

    createOutputMap({senderWallet, recipient, amount}){
        const outputMap = {};
        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }

    createInput({senderWallet, outputMap}){
        return {
        timestamp: Date.now(),
        address: senderWallet.publicKey,
        amount: senderWallet.balance,
        signature: senderWallet.sign(outputMap)
        }
        
    }

    update({senderWallet, recipient, amount}){

        if(amount > this.outputMap[senderWallet.publicKey]){
            throw new Error('Amount exceeds balance');
        }

        if(!this.outputMap[recipient]){
            this.outputMap[recipient] = amount;
        }
        else{
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        }
       
        this.outputMap[senderWallet.publicKey] = 
            this.outputMap[senderWallet.publicKey] - amount;
        this.input = this.createInput({senderWallet, outputMap: this.outputMap});
    }

    static validTransaction(transaction){
        const { input, outputMap } = transaction;
        const { address, amount, signature } = input;
        
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);

        if(amount !== outputTotal){
            console.error(`Invalid transaction from: ${address} `);
            return false;
        }

        if(!verifySignature({publicKey:address, data:outputMap, signature})){
            console.error(`Invalid signature from: ${address}`);
            return false;
        }
        return true;
    }
}

module.exports = Transaction;