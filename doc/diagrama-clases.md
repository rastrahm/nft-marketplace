# Diagrama de clases — NFT Marketplace

Modelo estructural de contratos, interfaces, structs y actores de test.

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
        +getApproved(uint256) address
        +isApprovedForAll(address, address) bool
        +safeTransferFrom(address, address, uint256)
        +transferFrom(address, address, uint256)
        +approve(address, uint256)
        +setApprovalForAll(address, bool)
    }

    class IERC2981 {
        <<interface>>
        +royaltyInfo(uint256, uint256) address, uint256
    }

    class ReentrancyGuard {
        <<abstract / custom>>
        #_status uint256
        #nonReentrant()
        #_nonReentrantBefore()
        #_nonReentrantAfter()
    }

    class Listing {
        <<struct>>
        +address seller
        +address nftAddress
        +uint256 tokenId
        +uint256 price
    }

    class NFTMarketplace {
        +uint256 feeBps
        +address feeRecipient
        +mapping listings
        +constructor(uint256, address)
        +listItem(address, uint256, uint256)
        +cancelListing(address, uint256)
        +buyItem(address, uint256) payable
        +updateListing(address, uint256, uint256)
        +getListing(address, uint256) Listing
        -_calculatePayments(address, uint256, uint256) payments
        -_pay(address, uint256)
    }

    class IMarketplaceErrors {
        <<errors>>
        +ItemNotForSale()
        +PriceNotMet()
        +NotItemOwner()
        +TransferFailed()
        +ZeroPrice()
    }

    class MarketplaceEvents {
        <<events>>
        +ItemListed(address, address, uint256, uint256)
        +ItemCanceled(address, address, uint256)
        +ItemBought(address, address, uint256, uint256)
        +ItemUpdated(address, address, uint256, uint256)
    }

    IERC165 <|-- IERC721 : extends
    IERC165 <|-- IERC2981 : extends
    ReentrancyGuard <|-- NFTMarketplace : inherits
    NFTMarketplace ..> Listing : uses
    NFTMarketplace ..> IERC721 : calls
    NFTMarketplace ..> IERC2981 : queries
    NFTMarketplace ..> IERC165 : queries
    NFTMarketplace ..> IMarketplaceErrors : reverts
    NFTMarketplace ..> MarketplaceEvents : emits
```

## 2. Contratos de prueba (mocks)

```mermaid
classDiagram
    direction LR

    class NFTMarketplace {
        +listItem()
        +buyItem()
        +cancelListing()
    }

    class MockERC721 {
        +mint(address, uint256)
        +safeTransferFrom()
    }

    class MockERC721Royalty {
        +mint(address, uint256)
        +setDefaultRoyalty(address, uint96)
        +royaltyInfo(uint256, uint256)
        +supportsInterface(bytes4) bool
    }

    class MaliciousActor {
        +marketplace address
        +attackOnReceive bool
        +buyAndReenter()
        +receive()
        +onERC721Received()
    }

    class NFTMarketplaceTest {
        <<Foundry Test>>
        +setUp()
        +test_ListCancelRelistBuy()
        +test_RoyaltyAndFeeSplit()
        +test_ReentrancyBlocked()
        +testFuzz_PriceAndFee(uint256, uint256)
    }

    IERC721 <|.. MockERC721 : implements
    IERC721 <|.. MockERC721Royalty : implements
    IERC2981 <|.. MockERC721Royalty : implements
    IERC165 <|.. MockERC721Royalty : implements

    NFTMarketplaceTest --> NFTMarketplace : deploys / calls
    NFTMarketplaceTest --> MockERC721 : deploys
    NFTMarketplaceTest --> MockERC721Royalty : deploys
    NFTMarketplaceTest --> MaliciousActor : deploys
    MaliciousActor --> NFTMarketplace : reentra
    NFTMarketplace --> MockERC721 : escrow / transfer
    NFTMarketplace --> MockERC721Royalty : escrow / royaltyInfo
```

## 3. Responsabilidades por clase

| Clase / artefacto | Responsabilidad |
|-------------------|-----------------|
| `NFTMarketplace` | Escrow, listings, compra atómica, split de pagos, guards |
| `Listing` | Datos mínimos de una venta activa |
| `ReentrancyGuard` | Bloqueo de reentrada en `buyItem` / `cancelListing` |
| `IERC721` | Custodia y transferencia del NFT |
| `IERC2981` | Cálculo de royalty por venta |
| `IERC165` | Detección de soporte ERC-2981 |
| `MockERC721` | NFT de test sin royalties |
| `MockERC721Royalty` | NFT de test con royalties |
| `MaliciousActor` | Intento de reentrancy en receive/fallback |
| `NFTMarketplaceTest` | Cobertura unitaria, seguridad y fuzz |

## 4. Relaciones de dependencia (resumen)

```
NFTMarketplace
  ├── hereda     → ReentrancyGuard
  ├── almacena   → Listing (mapping)
  ├── integra    → IERC721 (transferencias)
  ├── consulta   → IERC165 + IERC2981 (royalties)
  ├── emite      → ItemListed / ItemCanceled / ItemBought / ItemUpdated
  └── revierte   → custom errors
```

## 5. Layout Solidity del contrato principal

Orden de layout según convención del monorepo:

1. Interfaces / imports  
2. Libraries (si aplica)  
3. Contract `NFTMarketplace`  
4. Type declarations (`Listing`)  
5. State variables (`feeBps`, `feeRecipient`, `listings`)  
6. Events  
7. Errors  
8. Modifiers (`nonReentrant` vía herencia)  
9. Functions: constructor → external → public → internal → private  
