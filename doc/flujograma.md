# Flujograma del proyecto — NFT Marketplace

Flujograma operativo **as-built** (v1): setup → list → cancel/buy → payouts → seguridad → UI.

## 1. Flujograma maestro del sistema

```mermaid
flowchart TB
    subgraph SETUP["FASE 0 — Setup"]
        S1[Inicializar Foundry] --> S2[Deploy NFTMarketplace]
        S2 --> S3[Configurar feeBps y feeRecipient]
        S3 --> S4[Deploy / mintear NFTs de prueba]
    end

    subgraph LIST["FASE 1 — Listado"]
        L1[Seller aprueba o transfiere NFT] --> L2{Validaciones}
        L2 -->|price == 0| Lx1[ZeroPrice]
        L2 -->|no es owner| Lx2[NotItemOwner]
        L2 -->|OK| L3[Escrow: NFT → Marketplace]
        L3 --> L4[Persistir Listing]
        L4 --> L5[Emit ItemListed]
    end

    subgraph BRANCH["FASE 2 — Decisión post-listado"]
        B1{¿Qué ocurre?}
        B1 -->|Cancelar| C1
        B1 -->|Comprar| P1
    end

    subgraph CANCEL["FASE 2a — Cancelación"]
        C1[Entrar nonReentrant] --> C2{listing existe y caller = seller?}
        C2 -->|No| Cx[ItemNotForSale / NotItemOwner]
        C2 -->|Sí| C3[delete Listing]
        C3 --> C4[NFT → Seller]
        C4 --> C5[Emit ItemCanceled]
        C5 --> C6[Salir nonReentrant]
    end

    subgraph BUY["FASE 3 — Compra y liquidación"]
        P1[Entrar nonReentrant] --> P2{listing activo?}
        P2 -->|No| Px1[ItemNotForSale]
        P2 -->|Sí| P3{msg.value >= price?}
        P3 -->|No| Px2[PriceNotMet]
        P3 -->|Sí| P4[Cache Listing en memory]
        P4 --> P5[delete Listing — Effects]
        P5 --> P6[Calcular splits]
        P6 --> P7[NFT → Buyer]
        P7 --> P8[ETH → feeRecipient]
        P8 --> P9[ETH → royalty si aplica]
        P9 --> P10[ETH → Seller]
        P10 --> P11[Refund exceso opcional]
        P11 --> P12[Emit ItemBought]
        P12 --> P13[Salir nonReentrant]
    end

    SETUP --> LIST
    LIST --> BRANCH
    BRANCH --> CANCEL
    BRANCH --> BUY
    CANCEL --> END1([Marketplace idle])
    BUY --> END2([Venta cerrada])
```

## 2. Flujograma detallado de liquidación (payouts)

```mermaid
flowchart TD
    Start([Inicio cálculo de pagos]) --> Fee[protocolFee = price × feeBps / 10_000]
    Fee --> Rem1[remanente = price - protocolFee]

    Rem1 --> Check165{supportsInterface<br/>type IERC2981?}
    Check165 -->|false| NoRoy[royaltyAmount = 0<br/>royaltyTo = address 0]
    Check165 -->|true| Call2981[royaltyInfo tokenId, price]
    Call2981 --> Cap{royaltyAmount > remanente?}
    Cap -->|Sí| Clamp[royaltyAmount = remanente<br/>o política de revert]
    Cap -->|No| Keep[Usar royaltyAmount]
    Clamp --> SellerCalc
    Keep --> SellerCalc
    NoRoy --> SellerCalc

    SellerCalc[sellerAmount = price - protocolFee - royaltyAmount]

    SellerCalc --> PayOrder[Orden de Interactions]
    PayOrder --> T1[1. Transfer NFT al Buyer]
    T1 --> T2[2. call value protocolFee → feeRecipient]
    T2 --> T2ok{success?}
    T2ok -->|No| Fail1[TransferFailed]
    T2ok -->|Sí| T3{royaltyAmount > 0?}
    T3 -->|Sí| T3pay[3. call value royalty → receiver]
    T3pay --> T3ok{success?}
    T3ok -->|No| Fail2[TransferFailed]
    T3ok -->|Sí| T4
    T3 -->|No| T4[4. call value sellerAmount → seller]
    T4 --> T4ok{success?}
    T4ok -->|No| Fail3[TransferFailed]
    T4ok -->|Sí| Done([Payouts OK])
```

## 3. Flujograma de seguridad (reentrancy)

```mermaid
flowchart TD
    A[Buyer/Seller malicioso llama buyItem o cancelListing] --> B[nonReentrant: status = ENTERED]
    B --> C[Effects: delete listing]
    C --> D[Interaction: .call ETH o transfer NFT]
    D --> E{Contrato malicioso<br/>reentra en receive?}
    E -->|Sí| F[Segunda llamada a buyItem/cancelListing]
    F --> G{status == ENTERED?}
    G -->|Sí| H[Revert ReentrancyGuard]
    G -->|No| I[No debería ocurrir]
    E -->|No| J[Continúa payout normal]
    H --> K([Ataque fallido — estado consistente])
    J --> L([Transacción OK])
```

## 4. Flujograma del pipeline de desarrollo (TDD) — cumplido

```mermaid
flowchart LR
    A[.cursorrules] --> B[Tests .t.sol rojos]
    B --> C[listItem]
    C --> D[cancelListing + guard]
    D --> E[buyItem + fee]
    E --> F[ERC-2981]
    F --> G[Attack SWC-107]
    G --> H[Fuzz 1000]
    H --> I[Gas + NatSpec]
    I --> J[Demo Next.js + tema]
    J --> K([Módulo cerrado])
```

## 5. Matriz flujo ↔ función ↔ invariante

| Paso del flujograma | Función | Invariante |
|---------------------|---------|------------|
| Escrow al listar | `listItem` | `ownerOf(tokenId) == marketplace` |
| Listing activo | storage | `listings[nft][id].seller != 0` |
| Cancelación | `cancelListing` | NFT vuelve al seller; listing borrado |
| Pre-compra | `buyItem` | `msg.value >= price` |
| Post-effects | `buyItem` | listing borrado **antes** de calls |
| Post-compra | `buyItem` | `ownerOf == buyer`; suma payouts = price |
| Reentrada | guard transient | segunda llamada revierte |
| Sin ERC-2981 | payout | seller recibe `price - fee` |
| Con ERC-2981 | payout | fee + royalty + seller = price |

## 6. Flujo UI (demo)

```mermaid
flowchart TD
    U1[Abrir localhost:3000] --> U2[Conectar wallet Anvil]
    U2 --> U3{Acción}
    U3 -->|Mintear demo| U4[DemoERC721.mint]
    U3 -->|Listar| U5[approve + listItem]
    U3 -->|Cancelar| U6[cancelListing]
    U3 -->|Comprar| U7[buyItem + ETH]
    U3 -->|Tema| U8[Claro/Oscuro localStorage]
    U5 --> U9[Ver listing]
    U6 --> U9
    U7 --> U9
```

## 7. Cómo leer estos diagramas

1. **Setup → Listado**: estado on-chain.  
2. **Branch**: cancelar o comprar (no hay `updateListing` en v1).  
3. **Compra**: CEI + splits + eventos.  
4. **Seguridad / fuzz / UI**: cierre del módulo (fases 0–8 + demo).
