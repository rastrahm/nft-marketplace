# Class diagram — NFT Marketplace

**As-built** structural model (closed module): contracts, mocks, tests and demo.

## 1. Main diagram (UML / Mermaid)

```mermaid
classDiagram
    direction TB

    class IERC165 {
        <<interface>>
        +supportsInterface(bytes4) bool
    }

    class IERC721 {
        <<interface>>
        +ownerOf(uint256) address
        +approve(address, uint256)
        +safeTransferFrom(address, address, uint256)
    }

    class IERC2981 {
        <<interface>>
        +royaltyInfo(uint256, uint256) address, uint256
    }

    class Listing {
        <<struct — 2 slots>>
        +address seller
        +uint256 price
    }

    class ReentrancyGuard {
        <<abstract / EIP-1153 transient>>
        #nonReentrant()
    }

    class INFTMarketplace {
        <<interface>>
        +listItem(address, uint256, uint256)
        +cancelListing(address, uint256)
        +buyItem(address, uint256) payable
        +getListing(address, uint256) Listing
    }

    class NFTMarketplace {
        +uint256 feeBps
        +address feeRecipient
        +listItem()
        +cancelListing()
        +buyItem() payable
        +getListing() Listing
        +onERC721Received()
        -_calculatePayments()
        -_supportsERC2981()
        -_pay()
    }

    class DemoERC721 {
        <<src/mocks — deploy/UI>>
        +mint(address, uint256)
    }

    IERC165 <|-- IERC721
    IERC165 <|-- IERC2981
    INFTMarketplace <|.. NFTMarketplace
    ReentrancyGuard <|-- NFTMarketplace
    IERC721Receiver <|.. NFTMarketplace
    NFTMarketplace ..> Listing : uses
    NFTMarketplace ..> IERC721 : escrow
    NFTMarketplace ..> IERC2981 : royalty
    NFTMarketplace ..> IERC165 : detect
    DemoERC721 ..|> IERC721
```

## 2. Tests and malicious actors

```mermaid
classDiagram
    direction LR

    class NFTMarketplace
    class MockERC721
    class MockERC721Royalty
    class MaliciousActor {
        +configure()
        +listItem()
        +buyItem()
        +cancelListing()
        +receive()
        +onERC721Received()
    }
    class NFTMarketplacePhase1Test
    class NFTMarketplaceRoyaltyTest
    class ReentrancyAttackTest
    class NFTMarketplaceFuzzTest

    MockERC721 ..|> IERC721
    MockERC721Royalty ..|> IERC721
    MockERC721Royalty ..|> IERC2981
    NFTMarketplacePhase1Test --> NFTMarketplace
    NFTMarketplacePhase1Test --> MockERC721
    NFTMarketplaceRoyaltyTest --> MockERC721Royalty
    ReentrancyAttackTest --> MaliciousActor
    MaliciousActor --> NFTMarketplace : reenters
    NFTMarketplaceFuzzTest --> NFTMarketplace
```

## 3. Frontend (demo)

```mermaid
classDiagram
    direction TB
    class MarketplaceApp {
      +forSaleCatalog
      +createNFT
      +putUpForSale
    }
    class AppToolbar
    class ThemeToggle
    class useMarketplace {
      +catalog
      +owned
      +mintDemo()
      +listItem()
      +buyItem()
      +cancelListing()
    }
    class useWallet
    class useTheme
    class PublicEnv

    MarketplaceApp --> AppToolbar
    MarketplaceApp --> useWallet
    MarketplaceApp --> useMarketplace
    AppToolbar --> ThemeToggle
    ThemeToggle --> useTheme
    useMarketplace ..> PublicEnv : Zod
    useWallet ..> PublicEnv
```

The UI exposes three zones: **For sale** (catalog), **Create NFT** (mint), **Put up for sale** (approve + list).

## 4. Responsibilities

| Artifact | Role |
|----------|------|
| `NFTMarketplace` | Escrow, list/cancel/buy, fee/royalty/seller split |
| `Listing` | `{seller, price}` — 2 slots; keys = nft + tokenId |
| `ReentrancyGuard` | Transient lock on buy/cancel |
| `DemoERC721` | Demo NFT for Anvil / UI |
| `MockERC721` / `MockERC721Royalty` | Foundry tests |
| `MaliciousActor` | SWC-107 vectors |
| `MarketplaceApp` | 3-zone UI: catalog / mint / put up for sale |
| `useMarketplace` | On-chain catalog, owned tokens, mint/list/buy/cancel |
| `ThemeToggle` / `useTheme` | Light / dark (`market-theme`) |

## 5. Dependencies (summary)

```
NFTMarketplace
  ├── inherits   → ReentrancyGuard (transient)
  ├── implements → INFTMarketplace, IERC721Receiver
  ├── stores     → Listing (2 slots)
  ├── integrates → IERC721
  ├── queries    → IERC165 + IERC2981
  ├── emits      → ItemListed / ItemCanceled / ItemBought
  └── reverts    → custom errors (INFTMarketplace)
```

## 6. Solidity layout

1. Imports / interfaces  
2. Contract `NFTMarketplace`  
3. State (`feeBps`, `feeRecipient`, `_listings`) — `Listing` lives in the interface  
4. Constructor → external (`listItem`, `cancelListing`, `buyItem`, `getListing`)  
5. `onERC721Received`  
6. Private: `_calculatePayments`, `_supportsERC2981`, `_pay`
