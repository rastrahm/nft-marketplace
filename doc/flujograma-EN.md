# Project flowchart — NFT Marketplace

**As-built** operational flowchart (v1): setup → list → cancel/buy → payouts → security → UI.

## 1. Master system flowchart

```mermaid
flowchart TB
    subgraph SETUP["PHASE 0 — Setup"]
        S1[Initialize Foundry] --> S2[Deploy NFTMarketplace]
        S2 --> S3[Configure feeBps and feeRecipient]
        S3 --> S4[Deploy / mint test NFTs]
    end

    subgraph LIST["PHASE 1 — Listing"]
        L1[Seller approves or transfers NFT] --> L2{Validations}
        L2 -->|price == 0| Lx1[ZeroPrice]
        L2 -->|not the owner| Lx2[NotItemOwner]
        L2 -->|OK| L3[Escrow: NFT → Marketplace]
        L3 --> L4[Persist Listing]
        L4 --> L5[Emit ItemListed]
    end

    subgraph BRANCH["PHASE 2 — Post-listing decision"]
        B1{What happens?}
        B1 -->|Cancel| C1
        B1 -->|Buy| P1
    end

    subgraph CANCEL["PHASE 2a — Cancellation"]
        C1[Enter nonReentrant] --> C2{listing exists and caller = seller?}
        C2 -->|No| Cx[ItemNotForSale / NotItemOwner]
        C2 -->|Yes| C3[delete Listing]
        C3 --> C4[NFT → Seller]
        C4 --> C5[Emit ItemCanceled]
        C5 --> C6[Exit nonReentrant]
    end

    subgraph BUY["PHASE 3 — Purchase and settlement"]
        P1[Enter nonReentrant] --> P2{listing active?}
        P2 -->|No| Px1[ItemNotForSale]
        P2 -->|Yes| P3{msg.value >= price?}
        P3 -->|No| Px2[PriceNotMet]
        P3 -->|Yes| P4[Cache Listing in memory]
        P4 --> P5[delete Listing — Effects]
        P5 --> P6[Compute splits]
        P6 --> P7[NFT → Buyer]
        P7 --> P8[ETH → feeRecipient]
        P8 --> P9[ETH → royalty if applicable]
        P9 --> P10[ETH → Seller]
        P10 --> P11[Optional excess refund]
        P11 --> P12[Emit ItemBought]
        P12 --> P13[Exit nonReentrant]
    end

    SETUP --> LIST
    LIST --> BRANCH
    BRANCH --> CANCEL
    BRANCH --> BUY
    CANCEL --> END1([Marketplace idle])
    BUY --> END2([Sale closed])
```

## 2. Detailed settlement flowchart (payouts)

```mermaid
flowchart TD
    Start([Start payment computation]) --> Fee[protocolFee = price × feeBps / 10_000]
    Fee --> Rem1[remainder = price - protocolFee]

    Rem1 --> Check165{supportsInterface<br/>type IERC2981?}
    Check165 -->|false| NoRoy[royaltyAmount = 0<br/>royaltyTo = address 0]
    Check165 -->|true| Call2981[royaltyInfo tokenId, price]
    Call2981 --> Cap{royaltyAmount > remainder?}
    Cap -->|Yes| Clamp[royaltyAmount = remainder<br/>or revert policy]
    Cap -->|No| Keep[Use royaltyAmount]
    Clamp --> SellerCalc
    Keep --> SellerCalc
    NoRoy --> SellerCalc

    SellerCalc[sellerAmount = price - protocolFee - royaltyAmount]

    SellerCalc --> PayOrder[Interactions order]
    PayOrder --> T1[1. Transfer NFT to Buyer]
    T1 --> T2[2. call value protocolFee → feeRecipient]
    T2 --> T2ok{success?}
    T2ok -->|No| Fail1[TransferFailed]
    T2ok -->|Yes| T3{royaltyAmount > 0?}
    T3 -->|Yes| T3pay[3. call value royalty → receiver]
    T3pay --> T3ok{success?}
    T3ok -->|No| Fail2[TransferFailed]
    T3ok -->|Yes| T4
    T3 -->|No| T4[4. call value sellerAmount → seller]
    T4 --> T4ok{success?}
    T4ok -->|No| Fail3[TransferFailed]
    T4ok -->|Yes| Done([Payouts OK])
```

## 3. Security flowchart (reentrancy)

```mermaid
flowchart TD
    A[Malicious Buyer/Seller calls buyItem or cancelListing] --> B[nonReentrant: status = ENTERED]
    B --> C[Effects: delete listing]
    C --> D[Interaction: .call ETH or NFT transfer]
    D --> E{Malicious contract<br/>reenters in receive?}
    E -->|Yes| F[Second call to buyItem/cancelListing]
    F --> G{status == ENTERED?}
    G -->|Yes| H[Revert ReentrancyGuard]
    G -->|No| I[Should never happen]
    E -->|No| J[Normal payout continues]
    H --> K([Attack failed — consistent state])
    J --> L([Transaction OK])
```

## 4. Development pipeline flowchart (TDD) — completed

```mermaid
flowchart LR
    A[.cursorrules] --> B[Red .t.sol tests]
    B --> C[listItem]
    C --> D[cancelListing + guard]
    D --> E[buyItem + fee]
    E --> F[ERC-2981]
    F --> G[Attack SWC-107]
    G --> H[Fuzz 1000]
    H --> I[Gas + NatSpec]
    I --> J[Next.js demo + theme]
    J --> K([Module closed])
```

## 5. Flow ↔ function ↔ invariant matrix

| Flowchart step | Function | Invariant |
|----------------|----------|-----------|
| Escrow on listing | `listItem` | `ownerOf(tokenId) == marketplace` |
| Active listing | storage | `listings[nft][id].seller != 0` |
| Cancellation | `cancelListing` | NFT goes back to the seller; listing deleted |
| Pre-purchase | `buyItem` | `msg.value >= price` |
| Post-effects | `buyItem` | listing deleted **before** calls |
| Post-purchase | `buyItem` | `ownerOf == buyer`; sum of payouts = price |
| Reentry | transient guard | second call reverts |
| Without ERC-2981 | payout | seller receives `price - fee` |
| With ERC-2981 | payout | fee + royalty + seller = price |

## 6. UI flow (demo)

The UI separates **catalog**, **minting** and **publishing** (avoids mixing buttons).

```mermaid
flowchart TD
    U1[Open localhost:3000] --> U2[Connect wallet]
    U2 --> Z1[Zone 1 · For sale]
    U2 --> Z2[Zone 2 · Create NFT]
    U2 --> Z3[Zone 3 · Put up for sale]
    Z2 -->|mint free ID| M[DemoERC721.mint]
    M --> Z3
    Z3 -->|approve + listItem| L[Active listing]
    L --> Z1
    Z1 -->|Buy| B[buyItem + ETH]
    Z1 -->|Cancel if seller| C[cancelListing]
    U2 -->|Theme| T[Light/Dark localStorage]
```

Catalog: `ItemListed` events + `getListing` verification.  
Owned NFTs: `ownerOf` scan (demo, IDs 1…64).

Manual: `/ayuda` · setup: [`DEPLOY-EN.md`](./DEPLOY-EN.md).

## 7. How to read these diagrams

1. **Setup → Listing**: on-chain state.  
2. **Branch**: cancel or buy (no `updateListing` in v1).  
3. **Purchase**: CEI + splits + events.  
4. **Security / fuzz / UI**: module closure (phases 0–8 + demo).
