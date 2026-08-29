// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title MockERC721Royalty
 * @notice NFT de test con royalties ERC-2981.
 * @dev Usado en Fase 5 para verificar el split fee / royalty / seller.
 */
contract MockERC721Royalty is ERC721, ERC2981 {
    /**
     * @notice Despliega la colección con royalty por defecto.
     * @param name_ Nombre ERC-721.
     * @param symbol_ Símbolo ERC-721.
     * @param royaltyReceiver_ Beneficiario ERC-2981.
     * @param royaltyFeeNumerator_ Fee en basis points (denominador 10_000).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_
    ) ERC721(name_, symbol_) {
        _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
    }

    /**
     * @notice Mintea un token a `to` con `tokenId` arbitrario.
     * @param to Receptor.
     * @param tokenId Identificador del token.
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    /// @inheritdoc ERC721
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
