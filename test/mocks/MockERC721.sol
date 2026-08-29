// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @notice NFT de test sin royalties ERC-2981.
 * @dev Usado en Fase 1+ para list / cancel / buy sin path de royalty.
 */
contract MockERC721 is ERC721 {
    /**
     * @notice Despliega la colección mock.
     * @param name_ Nombre ERC-721.
     * @param symbol_ Símbolo ERC-721.
     */
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /**
     * @notice Mintea un token a `to` con `tokenId` arbitrario.
     * @param to Receptor.
     * @param tokenId Identificador del token.
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
