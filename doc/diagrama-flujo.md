# Diagrama de flujo — NFT Marketplace

Flujo de procesos de negocio del marketplace (vista de alto nivel).

## 1. Ciclo de vida completo del listing

```mermaid
flowchart TD
    Start([Inicio]) --> Deploy[Deploy NFTMarketplace<br/>feeBps + feeRecipient]
    Deploy --> Idle[Marketplace listo]

    Idle --> SellerAction{Acción del Seller}
    SellerAction -->|listItem| List[Listar NFT]
    SellerAction -->|cancelListing| Cancel[Cancelar listing]
    SellerAction -->|updateListing| Update[Actualizar precio]

    Idle --> BuyerAction{Acción del Buyer}
    BuyerAction -->|buyItem + ETH| Buy[Comprar NFT]

    List --> Listed[NFT en escrow<br/>Listing activo]
    Update --> Listed
    Cancel --> Returned[NFT devuelto al Seller]
    Returned --> Idle

    Listed --> Buy
    Buy --> Sold[NFT al Buyer<br/>ETH repartido]
    Sold --> Idle

    Listed -.->|sigue activo| Idle
```

## 2. Flujo de listado (`listItem`)

```mermaid
flowchart TD
    A([Seller llama listItem]) --> B{price > 0?}
    B -->|No| E1[Revert ZeroPrice]
    B -->|Sí| C{msg.sender es owner<br/>del tokenId?}
    C -->|No| E2[Revert NotItemOwner]
    C -->|Sí| D[safeTransferFrom<br/>Seller → Marketplace]
    D --> F[Guardar Listing<br/>seller, nft, tokenId, price]
    F --> G[Emit ItemListed]
    G --> H([Listing activo])
```

## 3. Flujo de cancelación (`cancelListing`)

```mermaid
flowchart TD
    A([Seller llama cancelListing]) --> B{Hay listing?}
    B -->|No| E1[Revert ItemNotForSale]
    B -->|Sí| C{msg.sender == listing.seller?}
    C -->|No| E2[Revert NotItemOwner]
    C -->|Sí| D[nonReentrant ON]
    D --> E[delete listings nft tokenId]
    E --> F[safeTransferFrom<br/>Marketplace → Seller]
    F --> G[Emit ItemCanceled]
    G --> H[nonReentrant OFF]
    H --> I([Fin])
```

## 4. Flujo de compra (`buyItem`)

```mermaid
flowchart TD
    A([Buyer llama buyItem con ETH]) --> B{Hay listing?}
    B -->|No| E1[Revert ItemNotForSale]
    B -->|Sí| C{msg.value >= price?}
    C -->|No| E2[Revert PriceNotMet]
    C -->|Sí| D[nonReentrant ON]
    D --> E[Cachear Listing en memoria]
    E --> F[delete listings — CEI]
    F --> G[Calcular fee + royalty + seller]
    G --> H[safeTransferFrom<br/>Marketplace → Buyer]
    H --> I[Pagar feeRecipient]
    I --> J[Pagar royalty receiver si aplica]
    J --> K[Pagar seller]
    K --> L{Exceso de ETH?}
    L -->|Sí| M[Refund al Buyer]
    L -->|No| N[Emit ItemBought]
    M --> N
    N --> O[nonReentrant OFF]
    O --> P([Fin])
```

## 5. Decisión de royalties (ERC-2981)

```mermaid
flowchart TD
    A[Precio de venta P] --> B[protocolFee = P * feeBps / 10000]
    B --> C{NFT.supportsInterface<br/>IERC2981?}
    C -->|No| D[royalty = 0<br/>seller = P - protocolFee]
    C -->|Sí| E[royaltyInfo tokenId, P]
    E --> F[royaltyAmount, receiver]
    F --> G{royaltyAmount válida<br/>respecto al remanente?}
    G -->|No / overflow| H[Ajustar o revert<br/>según política]
    G -->|Sí| I[seller = P - fee - royalty]
    D --> J[Ejecutar payouts]
    H --> J
    I --> J
```

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| Rectángulo | Proceso / acción |
| Diamante | Decisión / validación |
| Óvalo | Inicio / fin |
| Flecha punteada | Estado persistente |
