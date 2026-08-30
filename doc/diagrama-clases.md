# Diagrama de clases — NFT Marketplace

Modelo estructural **as-built** (módulo cerrado): contratos, mocks, tests y demo.

## 1. Diagrama principal (UML / Mermaid)

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

## 2. Tests y actores maliciosos

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
    MaliciousActor --> NFTMarketplace : reentra
    NFTMarketplaceFuzzTest --> NFTMarketplace
```

## 3. Frontend (demo)

```mermaid
classDiagram
    direction TB
    class MarketplaceApp
    class AppToolbar
    class ThemeToggle
    class useMarketplace
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

## 4. Responsabilidades

| Artefacto | Rol |
|-----------|-----|
| `NFTMarketplace` | Escrow, list/cancel/buy, split fee/royalty/seller |
| `Listing` | `{seller, price}` — 2 slots; claves = nft + tokenId |
| `ReentrancyGuard` | Lock transient en buy/cancel |
| `DemoERC721` | NFT de demo para Anvil / UI |
| `MockERC721` / `MockERC721Royalty` | Tests Foundry |
| `MaliciousActor` | Vectores SWC-107 |
| `MarketplaceApp` | UI: mintear, listar, cancelar, comprar |
| `ThemeToggle` / `useTheme` | Claro / oscuro (`market-theme`) |

## 5. Dependencias (resumen)

```
NFTMarketplace
  ├── hereda     → ReentrancyGuard (transient)
  ├── implementa → INFTMarketplace, IERC721Receiver
  ├── almacena   → Listing (2 slots)
  ├── integra    → IERC721
  ├── consulta   → IERC165 + IERC2981
  ├── emite      → ItemListed / ItemCanceled / ItemBought
  └── revierte   → custom errors (INFTMarketplace)
```

## 6. Layout Solidity

1. Imports / interfaces  
2. Contract `NFTMarketplace`  
3. State (`feeBps`, `feeRecipient`, `_listings`) — `Listing` en la interfaz  
4. Constructor → external (`listItem`, `cancelListing`, `buyItem`, `getListing`)  
5. `onERC721Received`  
6. Private: `_calculatePayments`, `_supportsERC2981`, `_pay`
