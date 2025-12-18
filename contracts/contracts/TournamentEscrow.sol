// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

interface ISeaCasterPass {
    function burnTicket(address player, uint256 tokenId) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/**
 * @title TournamentEscrow
 * @author SeaCaster Team
 * @notice Holds tournament entry fees (USDC) and distributes prizes.
 *
 * Entry modes:
 * - Ticket: Burn a tournament ticket (no USDC spent)
 * - USDC: Pay entry fee (split between prize pool and house)
 *
 * Features (Post-Audit Enhancements):
 * - maxParticipants limit per tournament (prevents gas issues)
 * - Batch prize distribution for large tournaments
 * - SafeERC20 for all USDC transfers
 * - Pausable emergency controls
 */
contract TournamentEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    ISeaCasterPass public immutable seaCasterPass;

    // Entry fee in USDC smallest units (default 0.50)
    uint256 public entryFee = 500_000;

    // House cut in basis points (default 10% = 1000)
    uint256 public houseCutBps = 1000; // max 20% enforced
    uint256 public constant MAX_HOUSE_CUT_BPS = 2000;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // Maximum participants per tournament (gas limit protection)
    uint256 public constant MAX_PARTICIPANTS_LIMIT = 500;

    enum TournamentType {
        Daily,
        Weekly,
        Boss,
        Championship
    }

    struct Tournament {
        uint256 prizePool;
        uint256 houseCut;
        uint256 ticketId;
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        bool finalized;
        TournamentType tType;
        address[] participants;
    }

    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => bool)) public hasEntered;

    uint256 public nextTournamentId = 1;

    // Events
    event TournamentCreated(
        uint256 indexed tournamentId,
        TournamentType indexed tType,
        uint256 ticketId,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants
    );
    event PlayerEntered(uint256 indexed tournamentId, address indexed player, bool usedTicket);
    event PrizeDistributed(uint256 indexed tournamentId, address indexed winner, uint256 amount);
    event PrizeBatchDistributed(uint256 indexed tournamentId, uint256 winnersCount, uint256 totalAmount);
    event TournamentFinalized(uint256 indexed tournamentId, uint256 remainingPrizePool, uint256 houseCut);
    event EntryFeeUpdated(uint256 oldFee, uint256 newFee);
    event HouseCutUpdated(uint256 oldCut, uint256 newCut);

    // Custom errors (gas efficient)
    error InvalidDuration();
    error InvalidMaxParticipants();
    error TournamentEnded();
    error TournamentNotEnded();
    error AlreadyFinalized();
    error AlreadyEntered();
    error NoTicket();
    error TournamentFull();
    error InvalidAmount();
    error InsufficientPool();
    error NotInTournament();
    error LengthMismatch();

    constructor(address _usdc, address _seaCasterPass) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_seaCasterPass != address(0), "Invalid pass");
        usdc = IERC20(_usdc);
        seaCasterPass = ISeaCasterPass(_seaCasterPass);
    }

    // ───────────────────── Tournament Lifecycle ─────────────────────

    /// @notice Create a new tournament with participant limit
    /// @param ticketId The ticket token ID required for free entry
    /// @param durationSeconds How long the tournament runs
    /// @param tType Tournament type (Daily/Weekly/Boss/Championship)
    /// @param maxParticipants Maximum number of players (1-500)
    function createTournament(
        uint256 ticketId,
        uint256 durationSeconds,
        TournamentType tType,
        uint256 maxParticipants
    ) external onlyOwner whenNotPaused returns (uint256 tournamentId) {
        if (durationSeconds == 0) revert InvalidDuration();
        if (maxParticipants == 0 || maxParticipants > MAX_PARTICIPANTS_LIMIT) {
            revert InvalidMaxParticipants();
        }

        tournamentId = nextTournamentId++;

        uint256 start = block.timestamp;
        uint256 end = start + durationSeconds;

        tournaments[tournamentId] = Tournament({
            prizePool: 0,
            houseCut: 0,
            ticketId: ticketId,
            startTime: start,
            endTime: end,
            maxParticipants: maxParticipants,
            finalized: false,
            tType: tType,
            participants: new address[](0)
        });

        emit TournamentCreated(tournamentId, tType, ticketId, start, end, maxParticipants);
    }

    // ───────────────────── Entry ─────────────────────

    /// @notice Enter tournament with ticket (free entry, ticket burned)
    function enterWithTicket(uint256 tournamentId) external nonReentrant whenNotPaused {
        Tournament storage t = tournaments[tournamentId];
        
        if (block.timestamp >= t.endTime) revert TournamentEnded();
        if (t.finalized) revert AlreadyFinalized();
        if (hasEntered[tournamentId][msg.sender]) revert AlreadyEntered();
        if (seaCasterPass.balanceOf(msg.sender, t.ticketId) == 0) revert NoTicket();
        if (t.participants.length >= t.maxParticipants) revert TournamentFull();

        // Burn the ticket
        seaCasterPass.burnTicket(msg.sender, t.ticketId);

        hasEntered[tournamentId][msg.sender] = true;
        t.participants.push(msg.sender);

        emit PlayerEntered(tournamentId, msg.sender, true);
    }

    /// @notice Enter tournament with USDC
    function enterWithUSDC(uint256 tournamentId) external nonReentrant whenNotPaused {
        Tournament storage t = tournaments[tournamentId];
        
        if (block.timestamp >= t.endTime) revert TournamentEnded();
        if (t.finalized) revert AlreadyFinalized();
        if (hasEntered[tournamentId][msg.sender]) revert AlreadyEntered();
        if (t.participants.length >= t.maxParticipants) revert TournamentFull();

        // Transfer USDC from player to escrow
        usdc.safeTransferFrom(msg.sender, address(this), entryFee);

        // Split: prize pool vs house
        uint256 house = (entryFee * houseCutBps) / BPS_DENOMINATOR;
        uint256 prize = entryFee - house;

        t.prizePool += prize;
        t.houseCut += house;

        hasEntered[tournamentId][msg.sender] = true;
        t.participants.push(msg.sender);

        emit PlayerEntered(tournamentId, msg.sender, false);
    }

    // ───────────────────── Prize Distribution ─────────────────────

    /// @notice Distribute prize to a single winner
    /// @dev Can be called multiple times until prizePool is fully distributed.
    function distributePrize(
        uint256 tournamentId,
        address winner,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        Tournament storage t = tournaments[tournamentId];
        
        if (t.finalized) revert AlreadyFinalized();
        if (amount == 0) revert InvalidAmount();
        if (amount > t.prizePool) revert InsufficientPool();
        if (!hasEntered[tournamentId][winner]) revert NotInTournament();

        t.prizePool -= amount;
        usdc.safeTransfer(winner, amount);

        emit PrizeDistributed(tournamentId, winner, amount);
    }

    /// @notice Distribute prizes to multiple winners at once (gas efficient for large tournaments)
    /// @param tournamentId The tournament ID
    /// @param winners Array of winner addresses
    /// @param amounts Array of prize amounts for each winner
    function distributePrizeBatch(
        uint256 tournamentId,
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant whenNotPaused {
        if (winners.length != amounts.length) revert LengthMismatch();
        if (winners.length == 0) revert InvalidAmount();

        Tournament storage t = tournaments[tournamentId];
        if (t.finalized) revert AlreadyFinalized();

        // Calculate total and validate all winners
        uint256 totalDistribution = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            if (!hasEntered[tournamentId][winners[i]]) revert NotInTournament();
            if (amounts[i] == 0) revert InvalidAmount();
            totalDistribution += amounts[i];
        }

        if (totalDistribution > t.prizePool) revert InsufficientPool();

        // Update state before transfers (CEI pattern)
        t.prizePool -= totalDistribution;

        // Transfer to all winners
        for (uint256 i = 0; i < winners.length; i++) {
            usdc.safeTransfer(winners[i], amounts[i]);
            emit PrizeDistributed(tournamentId, winners[i], amounts[i]);
        }

        emit PrizeBatchDistributed(tournamentId, winners.length, totalDistribution);
    }

    /// @notice Finalize tournament and withdraw remaining funds to owner
    /// @dev Any undistributed prizePool and houseCut go to owner (house).
    function finalizeTournament(uint256 tournamentId) external onlyOwner nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        
        if (t.finalized) revert AlreadyFinalized();
        if (block.timestamp < t.endTime) revert TournamentNotEnded();

        t.finalized = true;

        uint256 totalHouse = t.houseCut;
        uint256 remainingPrize = t.prizePool;
        uint256 totalToOwner = totalHouse + remainingPrize;

        t.houseCut = 0;
        t.prizePool = 0;

        if (totalToOwner > 0) {
            usdc.safeTransfer(owner(), totalToOwner);
        }

        emit TournamentFinalized(tournamentId, remainingPrize, totalHouse);
    }

    // ───────────────────── Views ─────────────────────

    function getTournament(uint256 tournamentId)
        external
        view
        returns (
            uint256 prizePool,
            uint256 houseCut,
            uint256 ticketId,
            uint256 startTime,
            uint256 endTime,
            uint256 maxParticipants,
            bool finalized,
            TournamentType tType,
            uint256 participantCount
        )
    {
        Tournament storage t = tournaments[tournamentId];
        return (
            t.prizePool,
            t.houseCut,
            t.ticketId,
            t.startTime,
            t.endTime,
            t.maxParticipants,
            t.finalized,
            t.tType,
            t.participants.length
        );
    }

    function getParticipants(uint256 tournamentId) external view returns (address[] memory) {
        return tournaments[tournamentId].participants;
    }

    /// @notice Check if a tournament is full
    function isTournamentFull(uint256 tournamentId) external view returns (bool) {
        Tournament storage t = tournaments[tournamentId];
        return t.participants.length >= t.maxParticipants;
    }

    /// @notice Get remaining spots in a tournament
    function getRemainingSpots(uint256 tournamentId) external view returns (uint256) {
        Tournament storage t = tournaments[tournamentId];
        if (t.participants.length >= t.maxParticipants) return 0;
        return t.maxParticipants - t.participants.length;
    }

    // ───────────────────── Admin Config ─────────────────────

    function setEntryFee(uint256 newFee) external onlyOwner {
        emit EntryFeeUpdated(entryFee, newFee);
        entryFee = newFee;
    }

    function setHouseCut(uint256 newCutBps) external onlyOwner {
        require(newCutBps <= MAX_HOUSE_CUT_BPS, "Max 20%");
        emit HouseCutUpdated(houseCutBps, newCutBps);
        houseCutBps = newCutBps;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
