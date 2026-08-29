// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {INFTMarketplace} from "./interfaces/INFTMarketplace.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @notice Marketplace NFT con escrow. Fase 4: `buyItem` sin royalties (fee + seller).
 * @dev ERC-2981 se añade en la fase 5. Pagos ETH solo vía `.call{value}("")`.
 */
contract NFTMarketplace is INFTMarketplace, IERC721Receiver, ReentrancyGuard {
    /// @notice Fee de protocolo en basis points (denominador 10_000).
    uint256 public immutable feeBps;

    /// @notice Destinatario del fee de protocolo.
    address public immutable feeRecipient;

    /// @notice Listings activos: colección => tokenId => Listing.
    mapping(address nftAddress => mapping(uint256 tokenId => Listing)) private _listings;

    /**
     * @notice Configura fee de protocolo y vault.
     * @param feeBps_ Fee en basis points.
     * @param feeRecipient_ Receptor del fee.
     */
    constructor(uint256 feeBps_, address feeRecipient_) {
        feeBps = feeBps_;
        feeRecipient = feeRecipient_;
    }

    /**
     * @inheritdoc INFTMarketplace
     * @dev Checks: price > 0, caller = owner. Effects: guarda listing. Interactions: escrow vía `safeTransferFrom`.
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price) external {
        if (price == 0) revert ZeroPrice();

        IERC721 nft = IERC721(nftAddress);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotItemOwner();

        _listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            price: price
        });

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /**
     * @inheritdoc INFTMarketplace
     * @dev CEI: `delete` listing antes de `safeTransferFrom`. Protegido con `nonReentrant`.
     */
    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = _listings[nftAddress][tokenId];
        if (listing.seller == address(0)) revert ItemNotForSale();
        if (listing.seller != msg.sender) revert NotItemOwner();

        delete _listings[nftAddress][tokenId];

        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /**
     * @inheritdoc INFTMarketplace
     * @dev CEI + `nonReentrant`. Split: protocol fee + seller (sin royalty aún). Refund de exceso de ETH.
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant {
        Listing memory listing = _listings[nftAddress][tokenId];
        if (listing.seller == address(0)) revert ItemNotForSale();
        if (msg.value < listing.price) revert PriceNotMet();

        address seller = listing.seller;
        uint256 price = listing.price;

        delete _listings[nftAddress][tokenId];

        uint256 protocolFee = (price * feeBps) / 10_000;
        uint256 sellerProceeds = price - protocolFee;

        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        if (protocolFee > 0) {
            _pay(feeRecipient, protocolFee);
        }
        _pay(seller, sellerProceeds);

        uint256 excess = msg.value - price;
        if (excess > 0) {
            _pay(msg.sender, excess);
        }

        emit ItemBought(msg.sender, nftAddress, tokenId, price);
    }

    /// @inheritdoc INFTMarketplace
    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return _listings[nftAddress][tokenId];
    }

    /// @inheritdoc IERC721Receiver
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Envía ETH nativo con `.call`. Revierte `TransferFailed` si el receptor rechaza.
     * @param to Destinatario.
     * @param amount Wei a transferir.
     */
    function _pay(address to, uint256 amount) private {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
