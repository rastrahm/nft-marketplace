// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {NFTMarketplace} from "../../src/NFTMarketplace.sol";

/**
 * @title MaliciousActor
 * @notice Actor malicioso para campañas SWC-107: reentra desde `receive` o `onERC721Received`.
 * @dev El ataque debe fallar por `ReentrancyGuard` (+ CEI). Usado en `test/attack/`.
 */
contract MaliciousActor is IERC721Receiver {
    enum Attack {
        None,
        ReenterBuy,
        ReenterCancel
    }

    NFTMarketplace public immutable marketplace;

    Attack public attack;
    address public nftAddress;
    uint256 public tokenId;
    uint256 public reenterValue;
    uint256 public reenterCount;

    /**
     * @param marketplace_ Marketplace objetivo.
     */
    constructor(NFTMarketplace marketplace_) {
        marketplace = marketplace_;
    }

    /**
     * @notice Configura el vector de reentrada.
     * @param attack_ Tipo de ataque.
     * @param nftAddress_ Colección.
     * @param tokenId_ Token objetivo.
     * @param reenterValue_ ETH a enviar en reentrada a `buyItem` (si aplica).
     */
    function configure(Attack attack_, address nftAddress_, uint256 tokenId_, uint256 reenterValue_) external {
        attack = attack_;
        nftAddress = nftAddress_;
        tokenId = tokenId_;
        reenterValue = reenterValue_;
    }

    /**
     * @notice Lista un NFT ya poseído por este contrato.
     * @param nft Colección.
     * @param id Token.
     * @param price Precio.
     */
    function listItem(address nft, uint256 id, uint256 price) external {
        IERC721(nft).approve(address(marketplace), id);
        marketplace.listItem(nft, id, price);
    }

    /**
     * @notice Compra como buyer (puede reentrar en `onERC721Received`).
     * @param nft Colección.
     * @param id Token.
     */
    function buyItem(address nft, uint256 id) external payable {
        marketplace.buyItem{value: msg.value}(nft, id);
    }

    /**
     * @notice Cancela listing (puede reentrar en `onERC721Received` al recibir el NFT).
     * @param nft Colección.
     * @param id Token.
     */
    function cancelListing(address nft, uint256 id) external {
        marketplace.cancelListing(nft, id);
    }

    /// @inheritdoc IERC721Receiver
    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        _tryReenter();
        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Reentra al recibir ETH del payout (seller / fee / royalty / refund).
     */
    receive() external payable {
        _tryReenter();
    }

    function _tryReenter() private {
        if (attack == Attack.None) return;

        unchecked {
            ++reenterCount;
        }

        if (attack == Attack.ReenterBuy) {
            marketplace.buyItem{value: reenterValue}(nftAddress, tokenId);
        } else if (attack == Attack.ReenterCancel) {
            marketplace.cancelListing(nftAddress, tokenId);
        }
    }
}
