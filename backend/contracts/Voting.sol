// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;
    uint public constant MAX_CANDIDATES = 2;
    uint public maxVoters;
    uint public currentRound;
    bool public votingActive;
    
    mapping(address => bool) public hasVoted;
    mapping(string => uint) public votesByCandidate;

    mapping(uint => mapping(string => uint)) public votesByRound;
    mapping(uint => string[]) public candidatesByRound;
    
    string[] public candidates;
    mapping(string => bool) public candidateExists;
    
    // Pour garder une trace des électeurs pour le reset
    address[] public voters;
    mapping(address => bool) public isVoter;
    
    event VoteCast(address indexed voter, string candidate, uint round);
    event CandidateAdded(string candidate);
    event RoundStarted(uint round, string[] candidates);
    event VotingCompleted(string winner);
    event VotingRestarted();
    
    constructor(uint _maxVoters) {
        require(_maxVoters > 0, "Max voters must be greater than 0");
        owner = msg.sender;
        maxVoters = _maxVoters;
        currentRound = 1;
        votingActive = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        _;
    }
    
    function addCandidate(string memory candidateName) public onlyOwner {
        require(candidates.length < MAX_CANDIDATES, "Maximum number of candidates reached (2)");
        require(bytes(candidateName).length > 0, "Candidate name cannot be empty");
        require(!candidateExists[candidateName], "Candidate already exists");
        require(currentRound == 1, "Cannot add candidates after the first round has started");
        
        candidates.push(candidateName);
        candidateExists[candidateName] = true;
        
        emit CandidateAdded(candidateName);
    }
    
    function sendVote(string memory candidateName) public {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateExists[candidateName], "Candidate does not exist");
        require(candidates.length > 0, "No candidates available yet");
        require(getTotalVotes() < maxVoters, "Voting limit reached");
        
        // Ajouter l'électeur à la liste si ce n'est pas déjà fait
        if (!isVoter[msg.sender]) {
            voters.push(msg.sender);
            isVoter[msg.sender] = true;
        }
        
        hasVoted[msg.sender] = true;
        votesByCandidate[candidateName] += 1;
        
        emit VoteCast(msg.sender, candidateName, currentRound);

        if (getTotalVotes() == maxVoters) {
            checkForWinnerOrTie();
        }
    }

    function checkForWinnerOrTie() internal {
        (string[] memory winners) = getWinners();
        
        if (winners.length == 1) {
            votingActive = false;
            emit VotingCompleted(winners[0]);
        } else {
            startNewRound(winners);
        }
    }

    function startNewRound(string[] memory tiedCandidates) internal {
        // Sauvegarder les résultats du round actuel
        for (uint i = 0; i < candidates.length; i++) {
            votesByRound[currentRound][candidates[i]] = votesByCandidate[candidates[i]];
        }
        candidatesByRound[currentRound] = candidates;
        
        currentRound++;
        
        // Reset des votes pour le nouveau round
        for (uint i = 0; i < candidates.length; i++) {
            candidateExists[candidates[i]] = false;
            votesByCandidate[candidates[i]] = 0;
        }
        delete candidates;
        
        // Ajouter seulement les candidats à égalité
        for (uint i = 0; i < tiedCandidates.length; i++) {
            candidates.push(tiedCandidates[i]);
            candidateExists[tiedCandidates[i]] = true;
        }
        
        emit RoundStarted(currentRound, tiedCandidates);
    }

    function resetVotersForNewRound(address[] memory voterAddresses) public onlyOwner {
        for (uint i = 0; i < voterAddresses.length; i++) {
            hasVoted[voterAddresses[i]] = false;
        }
    }

    // Nouvelle fonction pour redémarrer complètement le vote
    function restartVoting() public onlyOwner {
        // Reset de tous les états
        currentRound = 1;
        votingActive = true;
        
        // Supprimer tous les candidats
        for (uint i = 0; i < candidates.length; i++) {
            candidateExists[candidates[i]] = false;
            votesByCandidate[candidates[i]] = 0;
        }
        delete candidates;
        
        // Reset de tous les électeurs
        for (uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
            isVoter[voters[i]] = false;
        }
        delete voters;
        
        // Reset des données historiques (optionnel)
        // Note: Les mappings imbriqués ne peuvent pas être supprimés facilement
        // mais les nouveaux rounds écraseront les données
        
        emit VotingRestarted();
    }

    // Fonction pour reset seulement les électeurs (pour les nouveaux rounds)
    function resetAllVoters() public onlyOwner {
        for (uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }
    }

    function getWinners() public view returns (string[] memory winners) {
        require(candidates.length > 0, "No candidates available");
        
        uint maxVotes = 0;
        uint winnerCount = 0;
        
        for (uint i = 0; i < candidates.length; i++) {
            uint currentVotes = votesByCandidate[candidates[i]];
            if (currentVotes > maxVotes) {
                maxVotes = currentVotes;
                winnerCount = 1;
            } else if (currentVotes == maxVotes) {
                winnerCount++;
            }
        }
        
        winners = new string[](winnerCount);
        uint index = 0;
        
        for (uint i = 0; i < candidates.length; i++) {
            if (votesByCandidate[candidates[i]] == maxVotes) {
                winners[index] = candidates[i];
                index++;
            }
        }
        
        return winners;
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
    
    function getResultsByRound(uint round) public view returns (string[] memory, uint[] memory) {
        string[] memory roundCandidates = candidatesByRound[round];
        uint[] memory votes = new uint[](roundCandidates.length);
        
        for (uint i = 0; i < roundCandidates.length; i++) {
            votes[i] = votesByRound[round][roundCandidates[i]];
        }
        
        return (roundCandidates, votes);
    }
    
    function getTotalVotes() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < candidates.length; i++) {
            total += votesByCandidate[candidates[i]];
        }
        return total;
    }

    function getRemainingVotes() public view returns (uint) {
        return maxVoters - getTotalVotes();
    }
    
    function canVote() public view returns (bool) {
        return votingActive && 
               candidates.length > 0 && 
               !hasVoted[msg.sender] && 
               getTotalVotes() < maxVoters;
    }

    function isVotingComplete() public view returns (bool) {
        return getTotalVotes() == maxVoters;
    }

    function getVotingStatus() public view returns (
        uint _currentRound,
        uint _totalVotes,
        uint _maxVoters,
        uint _remainingVotes,
        bool _votingActive,
        bool _isComplete
    ) {
        return (
            currentRound,
            getTotalVotes(),
            maxVoters,
            getRemainingVotes(),
            votingActive,
            isVotingComplete()
        );
    }

    function setMaxVoters(uint _newMaxVoters) public onlyOwner {
        require(getTotalVotes() == 0, "Cannot change max voters after voting started");
        require(_newMaxVoters > 0, "Max voters must be greater than 0");
        maxVoters = _newMaxVoters;
    }
    
    // Fonction utilitaire pour obtenir tous les électeurs
    function getAllVoters() public view returns (address[] memory) {
        return voters;
    }
    
    // Fonction pour obtenir le nombre d'électeurs uniques
    function getVoterCount() public view returns (uint) {
        return voters.length;
    }
}