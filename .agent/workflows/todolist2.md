---
description: To do list p2
---

### PHASE 2: SMART CONTRACTS (Day 3, 12 Hours)

#### 2A: Project Setup (2 Hours)
- [ ] Initialize Hardhat
  ```bash
  cd contracts
  npx hardhat init
  # Choose: Create TypeScript project
  ```

- [ ] Install dependencies
  ```bash
  npm install @openzeppelin/contracts dotenv @nomicfoundation/hardhat-ethers ethers
  ```

- [ ] Set up environment
  - [ ] Create `.env.example`
  - [ ] Get Base Sepolia RPC URL (from Alchemy/Infura)
  - [ ] Get Base Mainnet RPC URL
  - [ ] Get deployer private key

#### 2B: Deploy TournamentPool.sol (4 Hours)
- [ ] Create contract
  ```solidity
  // contracts/TournamentPool.sol
  pragma solidity ^0.8.0;
  
  import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
  import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
  
  contract TournamentPool is ReentrancyGuard {
      IERC20 public usdc;
      address public owner;
      uint public housePercentage = 10; // 10%
      
      struct Tournament {
          uint id;
          uint entryFee;
          uint prizePool;
          uint participants;
          bool completed;
      }
      
      mapping(uint => Tournament) public tournaments;
      mapping(uint => mapping(address => bool)) public participants;
      
      event TournamentCreated(uint indexed id, uint entryFee, uint prizePool);
      event ParticipantEntered(uint indexed tournament, address indexed player);
      event PrizeDistributed(uint indexed tournament, address indexed winner, uint amount);
      
      constructor(address _usdc) {
          usdc = IERC20(_usdc);
          owner = msg.sender;
      }
      
      function createTournament(
          uint _id,
          uint _entryFee,
          uint _expectedParticipants
      ) external onlyOwner {
          uint prizePool = (_entryFee * _expectedParticipants * (100 - housePercentage)) / 100;
          tournaments[_id] = Tournament({
              id: _id,
              entryFee: _entryFee,
              prizePool: prizePool,
              participants: 0,
              completed: false
          });
          emit TournamentCreated(_id, _entryFee, prizePool);
      }
      
      function enterTournament(uint _tournamentId) external nonReentrant {
          require(!participants[_tournamentId][msg.sender], "Already entered");
          
          usdc.transferFrom(msg.sender, address(this), tournaments[_tournamentId].entryFee);
          participants[_tournamentId][msg.sender] = true;
          tournaments[_tournamentId].participants++;
          
          emit ParticipantEntered(_tournamentId, msg.sender);
      }
      
      function distributePrize(
          uint _tournamentId,
          address _winner,
          uint _amount
      ) external onlyOwner {
          usdc.transfer(_winner, _amount);
          emit PrizeDistributed(_tournamentId, _winner, _amount);
      }
      
      function withdrawFees(uint _amount) external onlyOwner {
          usdc.transfer(owner, _amount);
      }
      
      modifier onlyOwner() {
          require(msg.sender == owner, "Not owner");
          _;
      }
  }
  ```

- [ ] Test contract
  ```bash
  npx hardhat test
  ```

- [ ] Deploy to Sepolia testnet first
  ```bash
  npx hardhat run scripts/deploy.ts --network baseSepolia
  ```

- [ ] Verify on BaseScan
  - [ ] Copy contract address
  - [ ] Verify source code on BaseScan

#### 2C: Deploy SeasonPass.sol (4 Hours)
- [ ] Create contract
  ```solidity
  pragma solidity ^0.8.0;
  
  import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
  
  contract SeasonPass {
      IERC20 public usdc;
      address public owner;
      
      uint public passPrice = 9990000; // $9.99 in USDC (6 decimals)
      uint public passDuration = 60 days;
      
      mapping(address => uint256) public passExpiry;
      
      event SeasonPassPurchased(address indexed buyer, uint256 expiry);
      
      constructor(address _usdc) {
          usdc = IERC20(_usdc);
          owner = msg.sender;
      }
      
      function purchasePass() external {
          usdc.transferFrom(msg.sender, owner, passPrice);
          passExpiry[msg.sender] = block.timestamp + passDuration;
          emit SeasonPassPurchased(msg.sender, passExpiry[msg.sender]);
      }
      
      function hasActivePass(address _user) external view returns (bool) {
          return passExpiry[_user] > block.timestamp;
      }
      
      function getRemainingTime(address _user) external view returns (uint256) {
          if (passExpiry[_user] <= block.timestamp) return 0;
          return passExpiry[_user] - block.timestamp;
      }
      
      function updatePrice(uint256 _newPrice) external {
          require(msg.sender == owner, "Not owner");
          passPrice = _newPrice;
      }
  }
  ```

- [ ] Test contract
- [ ] Deploy to Sepolia, then Mainnet

#### 2D: Deploy RodNFT.sol (Optional, Can Defer) (2 Hours)
- [ ] Create ERC721 contract for tradeable rod parts
- [ ] Test and deploy

#### 2E: Mainnet Deployment (4 Hours)
- [ ] Switch to Base Mainnet RPC
- [ ] Deploy all contracts to Base Mainnet
  ```bash
  npx hardhat run scripts/deploy.ts --network baseMainnet
  ```

- [ ] Update contract addresses in `.env.production`
- [ ] Verify on BaseScan

---

### PHASE 3: BLOCKCHAIN INTEGRATION (1 Day, 8 Hours)

#### 3A: Connect Frontend to Contracts (4 Hours)
- [ ] Update `.env.production` with mainnet contract addresses
- [ ] Implement Season Pass purchase flow
  ```typescript
  async function purchaseSeasonPass() {
    const { hash } = await writeContract({
      address: SEASON_PASS_ADDRESS,
      abi: SeasonPassABI,
      functionName: 'purchasePass',
    })
    
    // Wait for confirmation
    await waitForTransactionReceipt({ hash })
    
    // Update game state
    gameState.hasSeasonPass = true
  }
  ```

- [ ] Implement tournament entry flow
- [ ] Implement prize distribution
- [ ] Add wallet connection (OnchainKit)

#### 3B: Test Transactions (2 Hours)
- [ ] Test Season Pass purchase (testnet first)
- [ ] Test tournament entry with USDC
- [ ] Test prize payouts
- [ ] Verify gas costs

#### 3C: Mainnet Safety Checks (2 Hours)
- [ ] Test with small amounts
- [ ] Verify contract addresses match
- [ ] Check for any reverts
- [ ] Monitor transaction costs

---

### PHASE 4: ANALYTICS & MONITORING (4 Hours)

#### 4A: PostHog Integration (2 Hours)
- [ ] Create PostHog account at cloud.posthog.com
- [ ] Get API key
- [ ] Install PostHog SDK
  ```bash
  npm install posthog-js
  ```
- [ ] Initialize in React
  ```typescript
  import posthog from 'posthog-js'
  
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
  })
  ```
- [ ] Track key events
  - User registration
  - Fish caught
  - Level up
  - Tournament entry
  - Season Pass purchase

#### 4B: Sentry Error Tracking (2 Hours)
- [ ] Create Sentry account
- [ ] Install Sentry SDK
  ```bash
  npm install @sentry/react
  ```
- [ ] Initialize in React
  ```typescript
  import * as Sentry from "@sentry/react"
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
  })
  ```
- [ ] Wrap routes with ErrorBoundary

---

### PHASE 5: DEPLOYMENT (1 Day, 8 Hours)

#### 5A: Vercel Frontend (2 Hours)
- [ ] Connect GitHub repository to Vercel
- [ ] Set environment variables
- [ ] Deploy
  ```bash
  vercel --prod
  ```
- [ ] Set up domain: seacaster.app

#### 5B: Railway Backend (2 Hours)
- [ ] Create Railway project
- [ ] Connect GitHub repository
- [ ] Add environment variables
  - DATABASE_URL
  - REDIS_URL
  - JWT_SECRET
- [ ] Auto-deploy on push

#### 5C: Supabase Database (1 Hour)
- [ ] Ensure backups enabled
- [ ] Test connection pooling
- [ ] Monitor performance

#### 5D: Final Configuration (3 Hours)
- [ ] Update API URLs in frontend
- [ ] Test all endpoints
- [ ] Verify WebSocket connections
- [ ] Check CORS settings

---

### PHASE 6: FARCASTER INTEGRATION (4 Hours)

- [ ] Create Farcaster Mini App account
- [ ] Generate account association
  ```bash
  npx @farcaster/signer sign --privateKey <your-key>
  ```

- [ ] Create `.well-known/farcaster.json` manifest
  ```json
  {
    "accountAssociation": {
      "header": "...",
      "payload": "...",
      "signature": "..."
    },
    "frame": {
      "version": "1",
      "name": "SeaCaster",
      "iconUrl": "https://seacaster.app/icon.png",
      "homeUrl": "https://seacaster.app",
      "imageUrl": "https://seacaster.app/og-image.png",
      "buttonTitle": "Start Fishing",
      "splashImageUrl": "https://seacaster.app/splash.png",
      "splashBackgroundColor": "#0A3A52"
    }
  }
  ```

- [ ] Deploy manifest to Vercel
- [ ] Test with Farcaster validator
- [ ] Submit to Farcaster Mini Apps directory

---

### PHASE 7: TESTING & QA (2 Days, 16 Hours)

#### 7A: Unit Testing (4 Hours)
- [ ] Test API endpoints
- [ ] Test Prisma models
- [ ] Test tournament logic
- [ ] Test prize calculations

#### 7B: Integration Testing (4 Hours)
- [ ] Test frontend ↔ backend
- [ ] Test blockchain transactions
- [ ] Test WebSocket updates
- [ ] Test database operations

#### 7C: End-to-End Testing (4 Hours)
- [ ] Full fishing loop
- [ ] Tournament entry & completion
- [ ] Season Pass purchase
- [ ] Marketplace trading
- [ ] Leaderboard updates
- [ ] Friend notifications

#### 7D: Performance Testing (2 Hours)
- [ ] Load testing (100+ concurrent users)
- [ ] Database query performance
- [ ] API response times (<100ms)
- [ ] Memory leak checks

#### 7E: Mobile Testing (2 Hours)
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Touch responsiveness
- [ ] Haptic feedback
- [ ] PWA installation

---

### PHASE 8: LAUNCH PREPARATION (1 Day, 8 Hours)

#### 8A: Marketing Assets (4 Hours)
- [ ] Create OG image (1200×800px)
  - Pirate-themed SeaCaster artwork
  - Clear title: "SeaCaster - Fishing Tournament Game"
  - Farcaster + Base logos

- [ ] Create Twitter card metadata
  - og:title, og:description, og:image
  - og:url = seacaster.app

- [ ] Create launch announcement text
  - Compelling hook
  - Game mechanics explanation
  - Call to action (Play now at seacaster.app)
  - Hashtags: #SeaCaster #FishingGame #Farcaster #Base

#### 8B: Community Setup (2 Hours)
- [ ] Create /seacaster Warpcast channel
  - Description: "Official SeaCaster Fishing Tournament Game"
  - Channel rules pinned
  - Community guidelines

- [ ] Join base/farcaster communities
- [ ] Prepare cross-promotion content

#### 8C: Support Preparation (2 Hours)
- [ ] Write FAQ document
- [ ] Create support/feedback form
- [ ] Set up email for inquiries
- [ ] Prepare common responses

---