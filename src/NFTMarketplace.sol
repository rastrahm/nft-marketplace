// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {INFTMarketplace} from "./interfaces/INFTMarketplace.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @notice Marketplace NFT con escrow. Fase 3: `cancelListing` + `ReentrancyGuard`.
 * @dev `buyItem` sigue en stub (`NotImplemented`) hasta la fase 4.
 */
contract NFTMarketplace is INFTMarketplace, IERC721Receiver, ReentrancyGuard {
    /// @notice Stub aún no implementado (fases posteriores).
    error NotImplemented();

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

    /// @inheritdoc INFTMarketplace
    function buyItem(address, uint256) external payable {
        revert NotImplemented();
    }

    /// @inheritdoc INFTMarketplace
    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return _listings[nftAddress][tokenId];
    }

    /// @inheritdoc IERC721Receiver
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
