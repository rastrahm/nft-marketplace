// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {NFTMarketplace} from "../src/NFTMarketplace.sol";
import {INFTMarketplace} from "../src/interfaces/INFTMarketplace.sol";
import {MockERC721} from "./mocks/MockERC721.sol";

/**
 * @title NFTMarketplacePhase1Test
 * @notice Suite TDD del marketplace: list / cancel / buy + e2e.
 * @dev Módulo cerrado (Fases 0–8). Ver `doc/GAS.md` y `doc/SWC-AUDIT.md`.
 */
contract NFTMarketplacePhase1Test is Test {
    uint256 internal constant FEE_BPS = 250; // 2.5%
    uint256 internal constant TOKEN_ID = 1;
    uint256 internal constant PRICE = 1 ether;

    NFTMarketplace internal marketplace;
    MockERC721 internal nft;

    address internal feeRecipient = makeAddr("feeRecipient");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        marketplace = new NFTMarketplace(FEE_BPS, feeRecipient);
        nft = new MockERC721("Mock NFT", "MNFT");

        nft.mint(seller, TOKEN_ID);
        vm.deal(buyer, 10 ether);
    }

    // -------------------------------------------------------------------------
    // listItem
    // -------------------------------------------------------------------------

    /**
     * @notice Lista: escrow del NFT en el marketplace + evento `ItemListed` + storage.
     */
    function test_listItem_escrowsNftAndEmitsItemListed() public {
        vm.startPrank(seller);
        nft.approve(address(marketplace), TOKEN_ID);

        vm.expectEmit(true, true, true, true, address(marketplace));
        emit INFTMarketplace.ItemListed(seller, address(nft), TOKEN_ID, PRICE);

        marketplace.listItem(address(nft), TOKEN_ID, PRICE);
        vm.stopPrank();

        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace), "NFT should be in escrow");

        INFTMarketplace.Listing memory listing = marketplace.getListing(address(nft), TOKEN_ID);
        assertEq(listing.seller, seller);
        assertEq(listing.price, PRICE);
    }

    /**
     * @notice Precio cero debe revertir con `ZeroPrice`.
     */
    function test_listItem_revertsZeroPrice() public {
        vm.startPrank(seller);
        nft.approve(address(marketplace), TOKEN_ID);

        vm.expectRevert(INFTMarketplace.ZeroPrice.selector);
        marketplace.listItem(address(nft), TOKEN_ID, 0);
        vm.stopPrank();
    }

    /**
     * @notice Solo el owner del token puede listarlo.
     */
    function test_listItem_revertsNotItemOwner() public {
        vm.prank(stranger);
        vm.expectRevert(INFTMarketplace.NotItemOwner.selector);
        marketplace.listItem(address(nft), TOKEN_ID, PRICE);
    }

    // -------------------------------------------------------------------------
    // cancelListing
    // -------------------------------------------------------------------------

    /**
     * @notice Cancelar: borra listing, emite evento y devuelve el NFT al seller.
     */
    function test_cancelListing_returnsNftToSeller() public {
        _listAsSeller();

        vm.expectEmit(true, true, true, true, address(marketplace));
        emit INFTMarketplace.ItemCanceled(seller, address(nft), TOKEN_ID);

        vm.prank(seller);
        marketplace.cancelListing(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), seller, "NFT should return to seller");

        INFTMarketplace.Listing memory listing = marketplace.getListing(address(nft), TOKEN_ID);
        assertEq(listing.seller, address(0), "listing must be cleared");
        assertEq(listing.price, 0);
    }

    /**
     * @notice Un tercero no puede cancelar el listing.
     */
    function test_cancelListing_revertsNotItemOwner() public {
        _listAsSeller();

        vm.prank(stranger);
        vm.expectRevert(INFTMarketplace.NotItemOwner.selector);
        marketplace.cancelListing(address(nft), TOKEN_ID);
    }

    /**
     * @notice Cancelar sin listing activo revierte `ItemNotForSale`.
     */
    function test_cancelListing_revertsItemNotForSale() public {
        vm.prank(seller);
        vm.expectRevert(INFTMarketplace.ItemNotForSale.selector);
        marketplace.cancelListing(address(nft), TOKEN_ID);
    }

    // -------------------------------------------------------------------------
    // buyItem
    // -------------------------------------------------------------------------

    /**
     * @notice Compra: NFT al buyer, fee al vault, neto al seller, evento `ItemBought`.
     */
    function test_buyItem_transfersNftAndSplitsPayment() public {
        _listAsSeller();

        uint256 feeAmount = (PRICE * FEE_BPS) / 10_000;
        uint256 sellerProceeds = PRICE - feeAmount;

        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;

        vm.expectEmit(true, true, true, true, address(marketplace));
        emit INFTMarketplace.ItemBought(buyer, address(nft), TOKEN_ID, PRICE);

        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), buyer, "NFT should go to buyer");
        assertEq(seller.balance - sellerBefore, sellerProceeds, "seller receives net proceeds");
        assertEq(feeRecipient.balance - feeBefore, feeAmount, "feeRecipient receives fee");

        INFTMarketplace.Listing memory listing = marketplace.getListing(address(nft), TOKEN_ID);
        assertEq(listing.seller, address(0), "listing must be cleared after buy");
    }

    /**
     * @notice ETH insuficiente revierte `PriceNotMet`.
     */
    function test_buyItem_revertsPriceNotMet() public {
        _listAsSeller();

        vm.prank(buyer);
        vm.expectRevert(INFTMarketplace.PriceNotMet.selector);
        marketplace.buyItem{value: PRICE - 1}(address(nft), TOKEN_ID);
    }

    /**
     * @notice Comprar un token no listado revierte `ItemNotForSale`.
     */
    function test_buyItem_revertsItemNotForSale() public {
        vm.prank(buyer);
        vm.expectRevert(INFTMarketplace.ItemNotForSale.selector);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);
    }

    // -------------------------------------------------------------------------
    // E2E: List -> Cancel -> Re-list -> Buy
    // -------------------------------------------------------------------------

    /**
     * @notice Flujo completo requerido por `.cursorrules`.
     */
    function test_e2e_listCancelRelistBuy() public {
        // List
        _listAsSeller();
        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));

        // Cancel
        vm.prank(seller);
        marketplace.cancelListing(address(nft), TOKEN_ID);
        assertEq(nft.ownerOf(TOKEN_ID), seller);

        // Re-list
        _listAsSeller();
        assertEq(nft.ownerOf(TOKEN_ID), address(marketplace));

        // Buy
        vm.prank(buyer);
        marketplace.buyItem{value: PRICE}(address(nft), TOKEN_ID);

        assertEq(nft.ownerOf(TOKEN_ID), buyer);
        INFTMarketplace.Listing memory listing = marketplace.getListing(address(nft), TOKEN_ID);
        assertEq(listing.seller, address(0));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * @dev Aprueba y lista `TOKEN_ID` como `seller`.
     */
    function _listAsSeller() internal {
        vm.startPrank(seller);
        nft.approve(address(marketplace), TOKEN_ID);
        marketplace.listItem(address(nft), TOKEN_ID, PRICE);
        vm.stopPrank();
    }
}
