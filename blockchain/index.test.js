const Blockchain = require('.');
const Block = require('./block');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');
const { cryptoHash } = require('../util');


describe('Blockchain', () => {
    
    let blockchain, newChain, originalChain, errorMock;

    beforeEach(()=> {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
        errorMock = jest.fn();
        global.console.error = errorMock;
    });

    it('blockchain.chain instanceof', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with block genesis', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new block to the blockchain', () => {
        const newData = 'foo-bar';
        blockchain.addBlock({data: newData});
        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
    });

    describe('isValidChain()', () => {
        describe('when does not start with a genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = {data: 'fake-genisis'};
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            });
        });

        describe('when the chain starts with genesis block and has multiple blocks', () =>{
            beforeEach(() => {
                blockchain.addBlock({data: 'Bears'});
                blockchain.addBlock({data: 'Beets'});
                blockchain.addBlock({data: 'Battlestar Galactica'});
            });

            describe('and a lastHash reference has changed', () => {
                it('returns false', () => {
                   blockchain.chain[2].lastHash = 'broken-lastHash';
                   expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', ()=>{
                it('returns false', () => {
                    blockchain.chain[2].data = 'some data bad and evil';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain not contains invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });

        })
    });

    describe('replaceChain()', () => {
        let logMock;
        beforeEach(()=> {
            logMock = jest.fn();
            global.console.log = logMock;
        });
        describe('when the new chain is not longer', () => {
            beforeEach(()=> {
                newChain.chain[0] = {new: 'chain'};
                blockchain.replaceChain(newChain.chain);
            });

            it('does not replace the chain', () => {
    
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });


        });
        
        describe('when the new chain is longer', () => {

            beforeEach(() => {
                newChain.addBlock({data: 'Bears'});
                newChain.addBlock({data: 'Beets'});
                newChain.addBlock({data: 'Battlestar Galactica'});
            });
            
            describe('when the chain is invalid', () => {

                beforeEach(() => {
                    newChain.chain[2].hash = 'some-fake-hash'; 
                    blockchain.replaceChain(newChain.chain);
                });

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });

                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });



            });
            
            describe('when the chain is valid', () => {

                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                });
                
                it('replaces the chain', () => {
                   
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs about chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });

            }); 
        });

        describe('and the validTransactions flag is true', () => {
            it('calls validTransactionData()', () => {
                const validTransactionDataMock = jest.fn();
                blockchain.validTransactionData = validTransactionDataMock;
                
                newChain.addBlock({data: 'foo'});
                blockchain.replaceChain(newChain.chain, true);

                expect(validTransactionDataMock).toHaveBeenCalled();
            });
        });

        describe('and the chain contain a block with a jumped difficulty', () => {
            it('returns false', () => {
                const lastBlock = blockchain.chain[blockchain.chain.length -1];
                const lastHash = lastBlock.hash;
                const timestamp = Date.now();
                const nonce = 0;
                const data=[];
                const difficulty = lastBlock.difficulty - 3;
                const hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);

                const badBlock = new Block({timestamp, nonce, difficulty, lastHash, hash, data});

                blockchain.chain.push(badBlock);

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);

            });
        });


    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;

        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({
                recipient: 'foo-address',
                amount: 65
            });
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });

        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addBlock({data: [transaction, rewardTransaction]});

                
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });

        describe('and the transaction data has multiple rewards', () => {
            
            it('returns false and logs error', () => {

                newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] })
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
                
            });
        });

        describe('and the transaction data has at least one malformed outputMap', () => {

            describe('and the transaction is not a reward transaction', () => {

                it('returns false and logs error', () => {
                    transaction.outputMap[wallet.publicKey]=999999;
                    newChain.addBlock({ data: [transaction, rewardTransaction] });

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the transaction is a reward transaction', () => {

                it('returns false and logs error', () => {
                    
                    rewardTransaction.outputMap[wallet.publicKey] = 999999;
                    newChain.addBlock({ data: [transaction, rewardTransaction] });

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at least one malformed input', () => {

            it('returns false and logs error', () => {
                
                wallet.balance = 9000;
                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    fooRecipient: 100
                }
                const evilTransaction ={
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)

                    },
                    outputMap: evilOutputMap
                }
                newChain.addBlock({data: [evilTransaction, rewardTransaction]});

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and a block contains a multiple identical transactions', () => {
            it('returns false and logs error', () => {
                
                newChain.addBlock({data: [transaction, transaction, transaction, rewardTransaction]});

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
            });
        });

    })
});