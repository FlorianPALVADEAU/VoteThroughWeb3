// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;
    uint public constant MAX_CANDIDATES = 2;
    
    mapping(address => bool) public hasVoted;
    mapping(string => uint) public votesByCandidate;
    
    string[] public candidates;
    mapping(string => bool) public candidateExists;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    

    function addCandidate(string memory candidateName) public onlyOwner {
        require(candidates.length < MAX_CANDIDATES, "Maximum number of candidates reached (2)");
        require(bytes(candidateName).length > 0, "Candidate name cannot be empty");
        require(!candidateExists[candidateName], "Candidate already exists");
        
        candidates.push(candidateName);
        candidateExists[candidateName] = true;
    }
    

    function sendVote(string memory candidateName) public {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateExists[candidateName], "Candidate does not exist");
        require(candidates.length > 0, "No candidates available yet");
        
        hasVoted[msg.sender] = true;
        
        votesByCandidate[candidateName] += 1;
    }
    

    function getVotesForCandidate(string memory candidateName) public view returns (uint) {
        require(candidateExists[candidateName], "Candidate does not exist");
        return votesByCandidate[candidateName];
    }
    

    function getAllCandidates() public view returns (string[] memory) {
        return candidates;
    }
    

    function getAllResults() public view returns (string[] memory, uint[] memory) {
        uint length = candidates.length;
        uint[] memory votes = new uint[](length);
        
        for (uint i = 0; i < length; i++) {
            votes[i] = votesByCandidate[candidates[i]];
        }
        
        return (candidates, votes);
    }
    

    function checkIfVoted(address _voter) public view returns (bool) {
        return hasVoted[_voter];
    }
    

    function getWinner() public view returns (string memory winnerName, uint winnerVotes) {
        require(candidates.length > 0, "No candidates available");
        
        uint maxVotes = 0;
        string memory winner = candidates[0];
        
        for (uint i = 0; i < candidates.length; i++) {
            uint currentVotes = votesByCandidate[candidates[i]];
            if (currentVotes > maxVotes) {
                maxVotes = currentVotes;
                winner = candidates[i];
            }
        }
        
        return (winner, maxVotes);
    }
    
    function getTotalVotes() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < candidates.length; i++) {
            total += votesByCandidate[candidates[i]];
        }
        return total;
    }
    
    function canVote() public view returns (bool) {
        return candidates.length > 0 && !hasVoted[msg.sender];
    }
}