// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

contract Voting {
    enum VoteStates {
        Absent,
        Yes,
        No
    }

    struct Proposal {
        address creator;
        string question;
        uint256 yesCount;
        uint256 noCount;
        mapping(address => VoteStates) voteStates;
        uint256 creationDate;
    }

    Proposal[] public proposals;

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    event ProposalCreated(uint256);
    event VoteCast(uint256, address indexed);

    address[] members;

    constructor(address[] memory _members) {
        members = _members;
        members.push(msg.sender);
    }

    function newProposal(string calldata _question) external onlyMembers {
        emit ProposalCreated(proposals.length);
        Proposal storage proposal = proposals.push();
        proposal.creator = msg.sender;
        proposal.question = _question;
        proposal.yesCount = 1;
        proposal.voteStates[msg.sender] = VoteStates.Yes;
        proposal.creationDate = block.timestamp;
    }

    function castVote(uint256 _proposalId, bool _supports)
        external
        onlyMembers
    {
        require(isOpenForVote(_proposalId), "This vote is now closed");
        Proposal storage proposal = proposals[_proposalId];

        // clear out previous vote
        if (proposal.voteStates[msg.sender] == VoteStates.Yes) {
            proposal.yesCount--;
        }
        if (proposal.voteStates[msg.sender] == VoteStates.No) {
            proposal.noCount--;
        }

        // add new vote
        if (_supports) {
            proposal.yesCount++;
            proposal.voteStates[msg.sender] = VoteStates.Yes;
        } else {
            proposal.noCount++;
            proposal.voteStates[msg.sender] = VoteStates.No;
        }

        emit VoteCast(_proposalId, msg.sender);
    }

    function removeVote(uint256 _proposalId) external onlyMembers {
        require(isOpenForVote(_proposalId), "This vote is now closed");
        Proposal storage prop = proposals[_proposalId];
        //Find the actual vote
        if (prop.voteStates[msg.sender] == VoteStates.Yes) {
            prop.yesCount--;
        }
        if (prop.voteStates[msg.sender] == VoteStates.No) {
            prop.noCount--;
        }

        //Clear the vote
        delete prop.voteStates[msg.sender];
    }

    function hasVoted(uint256 _proposalId) external view returns (bool) {
        Proposal storage prop = proposals[_proposalId];
        return
            prop.voteStates[msg.sender] == VoteStates.Yes ||
            prop.voteStates[msg.sender] == VoteStates.No;
    }

    function isOpenForVote(uint256 _proposalId) public view returns (bool) {
        return
            proposals[_proposalId].creationDate + 10 minutes > block.timestamp;
    }

    modifier onlyMembers() {
        bool isMember;
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                isMember = true;
            }
        }
        require(isMember, "Only members have access");
        _;
    }
}
