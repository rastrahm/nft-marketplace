# Flow diagram — NFT Marketplace

**As-built** business flows (v1, no `updateListing`). See also [flujograma-EN.md](./flujograma-EN.md) and [DEPLOY-EN.md](./DEPLOY-EN.md) (UI).

## 1. Full listing lifecycle

```mermaid
flowchart TD
    Start([Start]) --> Deploy[Deploy NFTMarketplace<br/>feeBps + feeRecipient]
    Deploy --> Idle[Marketplace ready]

    Idle --> SellerAction{Seller action}
    SellerAction -->|listItem| List[List NFT]
    SellerAction -->|cancelListing| Cancel[Cancel listing]

    Idle --> BuyerAction{Buyer action}
    BuyerAction -->|buyItem + ETH| Buy[Buy NFT]

    List --> Listed[NFT in escrow<br/>Active listing]
    Cancel --> Returned[NFT returned to Seller]
    Returned --> Idle

    Listed --> Buy
    Buy --> Sold[NFT to Buyer<br/>ETH split]
    Sold --> Idle

    Listed -.->|stays active| Idle
```

## 2. Listing flow (`listItem`)

```mermaid
flowchart TD
    A([Seller calls listItem]) --> B{price > 0?}
    B -->|No| E1[Revert ZeroPrice]
    B -->|Yes| C{msg.sender owns<br/>the tokenId?}
    C -->|No| E2[Revert NotItemOwner]
    C -->|Yes| D[safeTransferFrom<br/>Seller → Marketplace]
    D --> F[Store Listing<br/>seller, nft, tokenId, price]
    F --> G[Emit ItemListed]
    G --> H([Active listing])
```

## 3. Cancellation flow (`cancelListing`)

```mermaid
flowchart TD
    A([Seller calls cancelListing]) --> B{Listing exists?}
    B -->|No| E1[Revert ItemNotForSale]
    B -->|Yes| C{msg.sender == listing.seller?}
    C -->|No| E2[Revert NotItemOwner]
    C -->|Yes| D[nonReentrant ON]
    D --> E[delete listings nft tokenId]
    E --> F[safeTransferFrom<br/>Marketplace → Seller]
    F --> G[Emit ItemCanceled]
    G --> H[nonReentrant OFF]
    H --> I([End])
```

## 4. Purchase flow (`buyItem`)

```mermaid
flowchart TD
    A([Buyer calls buyItem with ETH]) --> B{Listing exists?}
    B -->|No| E1[Revert ItemNotForSale]
    B -->|Yes| C{msg.value >= price?}
    C -->|No| E2[Revert PriceNotMet]
    C -->|Yes| D[nonReentrant ON]
    D --> E[Cache Listing in memory]
    E --> F[delete listings — CEI]
    F --> G[Compute fee + royalty + seller]
    G --> H[safeTransferFrom<br/>Marketplace → Buyer]
    H --> I[Pay feeRecipient]
    I --> J[Pay royalty receiver if applicable]
    J --> K[Pay seller]
    K --> L{Excess ETH?}
    L -->|Yes| M[Refund the Buyer]
    L -->|No| N[Emit ItemBought]
    M --> N
    N --> O[nonReentrant OFF]
    O --> P([End])
```

## 5. Royalty decision (ERC-2981)

```mermaid
flowchart TD
    A[Sale price P] --> B[protocolFee = P * feeBps / 10000]
    B --> C{NFT.supportsInterface<br/>IERC2981?}
    C -->|No| D[royalty = 0<br/>seller = P - protocolFee]
    C -->|Yes| E[royaltyInfo tokenId, P]
    E --> F[royaltyAmount, receiver]
    F --> G{royaltyAmount valid<br/>against the remainder?}
    G -->|No / overflow| H[Adjust or revert<br/>per policy]
    G -->|Yes| I[seller = P - fee - royalty]
    D --> J[Execute payouts]
    H --> J
    I --> J
```

## Legend

| Symbol | Meaning |
|--------|---------|
| Rectangle | Process / action |
| Diamond | Decision / validation |
| Oval | Start / end |
| Dashed arrow | Persistent state |
