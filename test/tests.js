const { assert } = require('chai');
describe('Voting', function () {
  let contract;

  before(async () => {
    owner = ethers.provider.getSigner(0);
    member1 = ethers.provider.getSigner(1);
    member2 = ethers.provider.getSigner(2);
    nonmember = ethers.provider.getSigner(3);

    const Voting = await ethers.getContractFactory('Voting');
    contract = await Voting.deploy([
      await member1.getAddress(),
      await member2.getAddress(),
    ]);
    await contract.deployed();
  });

  describe('creating a new proposal from a nonmember', () => {
    it('should revert', async () => {
      let ex;
      try {
        await contract.connect(nonmember).newProposal('Should we donate to my address?');
      } catch (_ex) {
        ex = _ex;
      }
      assert(
        ex,
        'Attempted to create new proposal from a nonmember. Expected this transaction to revert!'
      );
    });
  });

  describe('creating a proposal from a member', () => {
    let receipt;
    before(async () => {
      const tx = await contract
        .connect(member1)
        .newProposal('Should we donate to charity?');
      receipt = await tx.wait();
    });

    it('should emit an `ProposalCreated` event', () => {
      const event = receipt.events.find((x) => x.event === 'ProposalCreated');
      assert(event, 'Event not found!');
    });

    it('should have one vote for yes', async () => {
      let id = 0;
      attributes = await contract.proposals(id);
      assert(attributes.yesCount, 'Could not find the yes count');
      assert.equal(attributes.yesCount.toNumber(), 1);
    });

    describe('casting a vote as a nonmember', () => {
      it('should revert', async () => {
        let ex;
        try {
          await contract.connect(nonmember).castVote(0, true);
        } catch (_ex) {
          ex = _ex;
        }
        assert(
          ex,
          'Attempted to create new proposal from a nonmember. Expected this transaction to revert!'
        );
      });
    });

    describe('casting a vote as the owner', () => {
      let receipt;
      before(async () => {
        const tx = await contract.connect(owner).castVote(0, false);
        receipt = await tx.wait();
      });

      it('should emit an `VoteCast` event', () => {
        const event = receipt.events.find((x) => x.event === 'VoteCast');
        assert(event, 'Event not found!');
      });
    });

    describe('casting a vote as the member', () => {
      let receipt;
      before(async () => {
        const tx = await contract.connect(member2).castVote(0, true);
        receipt = await tx.wait();
      });

      it('should emit an `VoteCast` event', () => {
        const event = receipt.events.find((x) => x.event === 'VoteCast');
        assert(event, 'Event not found!');
      });

      it('should say the member has voted on that proposal', async () => {
        const tx1 = await contract.connect(member2).hasVoted(0);
        assert(tx1);
      });
    });

    describe('casting four votes: three from the same address', () => {
      let attributes;
      before(async () => {
        let id = 0;
        await contract.connect(member1).castVote(id, false);
        await contract.connect(member1).castVote(id, true);
        await contract.connect(member1).castVote(id, true);
        await contract.connect(member2).castVote(id, false);
        attributes = await contract.proposals(id);
      });

      it('should have a yes count of 1', function () {
        assert(attributes.yesCount, 'Could not find the yes count');
        assert.equal(attributes.yesCount.toNumber(), 1);
      });

      it('should have a no count of 2', function () {
        assert(attributes.noCount, 'Could not find the no count');
        assert.equal(attributes.noCount.toNumber(), 2);
      });

      describe('creating a newer vote', function () {
        let attributes2;
        before(async () => {
          await contract.newProposal('Allow people to vote across different proposals?');
        });

        describe('voting as the first voter', function () {
          before(async () => {
            let id = 1;
            await contract.connect(member1).castVote(id, true);
            attributes2 = await contract.proposals(id);
          });

          it('should have a yes count of 2', function () {
            assert(attributes2.yesCount, 'Could not find the yes count');
            assert.equal(attributes2.yesCount.toNumber(), 2);
          });

          it('should have a no count of 0', function () {
            assert(attributes2.noCount, 'Could not find the no count');
            assert.equal(attributes2.noCount.toNumber(), 0);
          });
        });
      });
    });

    describe('deleting a vote', () => {
      let receipt;
      let oldYesCount;
      before(async () => {
        const tx1 = await contract.connect(member2).castVote(0, true);
        await tx1.wait();
        attributes3 = await contract.proposals(0);
        oldYesCount = attributes3.yesCount.toNumber();
        const tx = await contract.connect(member2).removeVote(0);
        receipt = await tx.wait();
      });
      it('should decrease the yes count', async () => {
        const attributes4 = await contract.proposals(0);
        const newYesCount = attributes4.yesCount.toNumber();
        assert.equal(newYesCount, oldYesCount - 1);
      });
      it('should say the member has not voted on that proposal', async () => {
        const tx1 = await contract.connect(member2).hasVoted(0);
        assert(!tx1);
      });
    });
  });
});
