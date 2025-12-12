// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISeaCasterPass {
    function burnTicket(address player, uint256 tokenId) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/**
 * @title TournamentEscrow
 * @notice Holds tournament entry fees and distributes prizes
 * 
 * Entry modes:
 * - Ticket: Burn a tournament ticket
 * - USDC: Pay $0.50 entry fee (90% to pool, 10% house)
 */
contract TournamentEscrow is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    ISeaCasterPass public immutable seaCasterPass;
    
    // Entry fee: $0.50 USDC
    uint256 public entryFee = 500_000;
    
    // House cut: 10%
    uint256 public houseCutBps = 1000; // 10% = 1000 basis points
    
    // Tournament data
    struct Tournament {
        uint256 prizePool;
        uint256 houseCut;
        uint256 ticketId;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        address[] participants;
    }
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => bool)) public hasEntered;
    
    uint256 public nextTournamentId = 1;
    
    // Events
    event TournamentCreated(uint256 indexed tournamentId, uint256 ticketId, uint256 startTime, uint256 endTime);
    event PlayerEntered(uint256 indexed tournamentId, address indexed player, bool usedTicket);
    event PrizeDistributed(uint256 indexed tournamentId, address indexed winner, uint256 amount);
    event TournamentFinalized(uint256 indexed tournamentId, uint256 totalPrize, uint256 houseCut);

    constructor(address _usdc, address _seaCasterPass) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        seaCasterPass = ISeaCasterPass(_seaCasterPass);
    }

    /// @notice Create a new tournament
    function createTournament(
        uint256 ticketId,
        uint256 durationSeconds
    ) external onlyOwner returns (uint256) {
        uint256 tournamentId = nextTournamentId++;
        
        tournaments[tournamentId] = Tournament({
            prizePool: 0,
            houseCut: 0,
            ticketId: ticketId,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            finalized: false,
            participants: new address[](0)
        });
        
        emit TournamentCreated(tournamentId, ticketId, block.timestamp, block.timestamp + durationSeconds);
        return tournamentId;
    }

    /// @notice Enter tournament with ticket (free entry)
    function enterWithTicket(uint256 tournamentId) external nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(block.timestamp < t.endTime, "Tournament ended");
        require(!hasEntered[tournamentId][msg.sender], "Already entered");
        require(seaCasterPass.balanceOf(msg.sender, t.ticketId) > 0, "No ticket");
        
        // Burn the ticket
        seaCasterPass.burnTicket(msg.sender, t.ticketId);
        
        hasEntered[tournamentId][msg.sender] = true;
        t.participants.push(msg.sender);
        
        emit PlayerEntered(tournamentId, msg.sender, true);
    }

    /// @notice Enter tournament with USDC
    function enterWithUSDC(uint256 tournamentId) external nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(block.timestamp < t.endTime, "Tournament ended");
        require(!hasEntered[tournamentId][msg.sender], "Already entered");
        
        // Transfer USDC
        require(usdc.transferFrom(msg.sender, address(this), entryFee), "USDC transfer failed");
        
        // Split: 90% prize pool, 10% house
        uint256 house = (entryFee * houseCutBps) / 10000;
        uint256 prize = entryFee - house;
        
        t.prizePool += prize;
        t.houseCut += house;
        
        hasEntered[tournamentId][msg.sender] = true;
        t.participants.push(msg.sender);
        
        emit PlayerEntered(tournamentId, msg.sender, false);
    }

    /// @notice Distribute prizes (backend calls with winner)
    function distributePrize(
        uint256 tournamentId,
        address winner,
        uint256 amount
    ) external onlyOwner nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(!t.finalized, "Already finalized");
        require(amount <= t.prizePool, "Insufficient prize pool");
        require(hasEntered[tournamentId][winner], "Winner not in tournament");
        
        t.prizePool -= amount;
        require(usdc.transfer(winner, amount), "Prize transfer failed");
        
        emit PrizeDistributed(tournamentId, winner, amount);
    }

    /// @notice Finalize tournament and withdraw house cut
    function finalizeTournament(uint256 tournamentId) external onlyOwner nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(!t.finalized, "Already finalized");
        require(block.timestamp >= t.endTime, "Tournament not ended");
        
        t.finalized = true;
        
        // Transfer house cut to owner
        if (t.houseCut > 0) {
            require(usdc.transfer(owner(), t.houseCut), "House cut transfer failed");
        }
        
        // Transfer remaining prize pool to owner (unclaimed prizes)
        if (t.prizePool > 0) {
            require(usdc.transfer(owner(), t.prizePool), "Remaining pool transfer failed");
        }
        
        emit TournamentFinalized(tournamentId, t.prizePool, t.houseCut);
    }

    /// @notice Get tournament info
    function getTournament(uint256 tournamentId) external view returns (
        uint256 prizePool,
        uint256 houseCut,
        uint256 ticketId,
        uint256 startTime,
        uint256 endTime,
        bool finalized,
        uint256 participantCount
    ) {
        Tournament storage t = tournaments[tournamentId];
        return (
            t.prizePool,
            t.houseCut,
            t.ticketId,
            t.startTime,
            t.endTime,
            t.finalized,
            t.participants.length
        );
    }

    /// @notice Get participants list
    function getParticipants(uint256 tournamentId) external view returns (address[] memory) {
        return tournaments[tournamentId].participants;
    }

    /// @notice Update entry fee (owner only)
    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
    }

    /// @notice Update house cut (owner only, max 20%)
    function setHouseCut(uint256 newCutBps) external onlyOwner {
        require(newCutBps <= 2000, "Max 20%");
        houseCutBps = newCutBps;
    }
}
