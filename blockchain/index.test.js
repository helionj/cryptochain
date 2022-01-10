const Blockchain = require('.');
const Block = require('./block');
const cryptoHash = require('../util/crypto-hash');


describe('Blockchain', () => {
    
    let blockchain, newChain, originalChain;

    beforeEach(()=> {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
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
        let logMock, errorMock;
        beforeEach(()=> {
            logMock = jest.fn();
            errorMock = jest.fn();
            global.console.error = errorMock;
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
});