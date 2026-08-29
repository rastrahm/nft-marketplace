// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
import {INFTMarketplace} from "../../src/interfaces/INFTMarketplace.sol";
import {ReentrancyGuard} from "../../src/utils/ReentrancyGuard.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {MaliciousActor} from "./MaliciousActor.sol";

/**
 * @title ReentrancyAttackTest
 * @notice Fase 6 / SWC-107: buyer/seller maliciosos no reentran con éxito en buy/cancel.
 * @dev Referencia: `doc/SWC-AUDIT.md` · patrón monorepo `02-crypto-bank` / `04-erc721` attack suite.
 */
contract ReentrancyAttackTest is Test {
    uint256 internal constant FEE_BPS = 250;
    uint256 internal constant TOKEN_ID = 1;
    uint256 internal constant PRICE = 1 ether;

    NFTMarketplace internal marketplace;
    MockERC721 internal nft;
    MaliciousActor internal attacker;

    address internal feeRecipient = makeAddr("feeRecipient");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");

    function setUp() public {
        marketplace = new NFTMarketplace(FEE_BPS, feeRecipient);
        nft = new MockERC721("Attack NFT", "ANFT");
        attacker = new MaliciousActor(marketplace);

        vm.deal(buyer, 10 ether);
        vm.deal(address(attacker), 10 ether);
    }

    /**
     * @notice SWC-107: seller malicioso reentra `buyItem` desde `receive` al cobrar.
     * @dev Inner guard → `receive` falla → `.call` false → `TransferFailed`; listing ya borrado (CEI).
     */
    function test_Attack_SellerReenterBuyOnPayout_RevertsTransferFailed() public {
        nft.mint(address(attacker), TOKEN_ID);
        attacker.configure(MaliciousActor.Attack.ReenterBuy, address(nft), TOKEN_ID, PRICE);
        attacker.listItem(address(nft), TOKEN_ID, PRICE);

        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));

        vm.expectRevert(INFTMarketplace.TransferFailed.selector);
        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        // Estado intacto: listing sigue activo (tx completa revertida)
        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));
        INFTMarketplace.Listing memory listing = marketplace.getListing(address(nft), TOKEN_ID);
        assertEq(listing.seller, address(attacker));
        assertEq(listing.price, PRICE);
    }

    /**
     * @notice SWC-107: seller malicioso reentra `cancelListing` desde `receive` durante la compra.
     */
    function test_Attack_SellerReenterCancelOnPayout_RevertsTransferFailed() public {
        nft.mint(address(attacker), TOKEN_ID);
        attacker.configure(MaliciousActor.Attack.ReenterCancel, address(nft), TOKEN_ID, 0);
        attacker.listItem(address(nft), TOKEN_ID, PRICE);

        vm.expectRevert(INFTMarketplace.TransferFailed.selector);
        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));
        assertEq(marketplace.getListing(address(nft), TOKEN_ID).seller, address(attacker));
    }

    /**
     * @notice SWC-107: buyer contrato reentra `buyItem` en `onERC721Received`.
     * @dev El revert del guard burbujea desde el callback de `safeTransferFrom`.
     */
    function test_Attack_BuyerReenterBuyOnERC721Received_RevertsGuard() public {
        nft.mint(seller, TOKEN_ID);
        vm.startPrank(seller);
        nft.approve(address(marketplace), TOKEN_ID);
        marketplace.listItem(address(nft), TOKEN_ID, PRICE);
        vm.stopPrank();

        attacker.configure(MaliciousActor.Attack.ReenterBuy, address(nft), TOKEN_ID, PRICE);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        attacker.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));
        assertEq(marketplace.getListing(address(nft), TOKEN_ID).seller, seller);
    }

    /**
     * @notice SWC-107: seller contrato reentra `cancelListing` al recuperar el NFT.
     */
    function test_Attack_SellerReenterCancelOnERC721Received_RevertsGuard() public {
        nft.mint(address(attacker), TOKEN_ID);
        attacker.configure(MaliciousActor.Attack.ReenterCancel, address(nft), TOKEN_ID, 0);
        attacker.listItem(address(nft), TOKEN_ID, PRICE);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        attacker.cancelListing(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));
        assertEq(marketplace.getListing(address(nft), TOKEN_ID).seller, address(attacker));
    }

    /**
     * @notice Compra honesta tras desactivar ataque: CEI + pagos OK (control negativo).
     */
    function test_Attack_HonestBuy_SucceedsWhenAttackDisabled() public {
        nft.mint(address(attacker), TOKEN_ID);
        attacker.configure(MaliciousActor.Attack.None, address(nft), TOKEN_ID, 0);
        attacker.listItem(address(nft), TOKEN_ID, PRICE);

        uint256 attackerBefore = address(attacker).balance;
        uint256 feeBefore = feeRecipient.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        uint256 feeAmount = (PRICE * FEE_BPS) / 10_000;
        assertEq(nft.ownerOf(TOKEN_ID), buyer);
        assertEq(feeRecipient.balance - feeBefore, feeAmount);
        assertEq(address(attacker).balance - attackerBefore, PRICE - feeAmount);
        assertEq(marketplace.getListing(address(nft), TOKEN_ID).seller, address(0));
    }
}
