// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {INFTMarketplace} from "./interfaces/INFTMarketplace.sol";

/**
 * @title NFTMarketplace
 * @notice Stub Fase 1: expone la API del marketplace; la lógica se implementa en fases 2+.
 * @dev Las mutaciones revierten con `NotImplemented` para que los tests Foundry fallen en rojo (TDD).
 */
contract NFTMarketplace is INFTMarketplace, IERC721Receiver {
    /// @notice Stub aún no implementado (solo Fase 1).
    error NotImplemented();

    /// @notice Fee de protocolo en basis points (denominador 10_000).
    uint256 public immutable feeBps;

    /// @notice Destinatario del fee de protocolo.
    address public immutable feeRecipient;

    /**
     * @notice Configura fee de protocolo y vault.
     * @param feeBps_ Fee en basis points.
     * @param feeRecipient_ Receptor del fee (`!= address(0)` en fases posteriores).
     */
    constructor(uint256 feeBps_, address feeRecipient_) {
        feeBps = feeBps_;
        feeRecipient = feeRecipient_;
    }

    /// @inheritdoc INFTMarketplace
    function listItem(address, uint256, uint256) external pure {
        revert NotImplemented();
    }

    /// @inheritdoc INFTMarketplace
    function cancelListing(address, uint256) external pure {
        revert NotImplemented();
    }

    /// @inheritdoc INFTMarketplace
    function buyItem(address, uint256) external payable {
        revert NotImplemented();
    }

    /// @inheritdoc INFTMarketplace
    function getListing(address, uint256) external pure returns (Listing memory) {
        revert NotImplemented();
    }

    /// @inheritdoc IERC721Receiver
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
