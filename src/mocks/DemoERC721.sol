// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title DemoERC721
 * @notice Colección mínima para la demo del marketplace (mint público de prueba).
 * @dev Solo para Anvil / entornos de desarrollo. No usar en mainnet.
 */
contract DemoERC721 is ERC721 {
    /**
     * @notice Despliega la colección demo.
     * @param name_ Nombre ERC-721.
     * @param symbol_ Símbolo ERC-721.
     */
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /**
     * @notice Mintea `tokenId` a `to` (sin control de acceso — solo demo).
     * @param to Receptor.
     * @param tokenId Identificador.
     */
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
