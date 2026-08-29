// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title INFTMarketplace
 * @notice API del marketplace NFT con escrow, fee de protocolo y royalties ERC-2981.
 * @dev Los selectores de errores/eventos se usan en tests Foundry (`vm.expectRevert` / `vm.expectEmit`).
 */
interface INFTMarketplace {
    /// @notice Datos de un listing activo.
    struct Listing {
        address seller;
        address nftAddress;
        uint256 tokenId;
        uint256 price;
    }

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    /// @notice No hay listing activo para el par (nft, tokenId).
    error ItemNotForSale();

    /// @notice `msg.value` es menor que el precio listado.
    error PriceNotMet();

    /// @notice El caller no es el owner del NFT o del listing.
    error NotItemOwner();

    /// @notice Falló un pago ETH vía `.call`.
    error TransferFailed();

    /// @notice El precio de listado / update es cero.
    error ZeroPrice();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /**
     * @notice NFT listado y custodiado por el marketplace.
     * @param seller Vendedor.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Identificador del token.
     * @param price Precio en wei.
     */
    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    /**
     * @notice Listing cancelado; NFT devuelto al seller.
     * @param seller Vendedor.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Identificador del token.
     */
    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    /**
     * @notice Compra ejecutada.
     * @param buyer Comprador.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Identificador del token.
     * @param price Precio pagado (precio del listing).
     */
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    // -------------------------------------------------------------------------
    // Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Lista un NFT: lo transfiere en escrow al marketplace.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Token a listar.
     * @param price Precio en wei (`> 0`).
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price) external;

    /**
     * @notice Cancela un listing y devuelve el NFT al seller.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Token a cancelar.
     */
    function cancelListing(address nftAddress, uint256 tokenId) external;

    /**
     * @notice Compra un NFT listado pagando al menos `price` en ETH.
     * @param nftAddress Colección ERC-721.
     * @param tokenId Token a comprar.
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable;

    /**
     * @notice Devuelve el listing activo (o struct vacío si no existe).
     * @param nftAddress Colección ERC-721.
     * @param tokenId Token consultado.
     * @return listing Datos del listing.
     */
    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory listing);
}
