// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";

import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
import {INFTMarketplace} from "../../src/interfaces/INFTMarketplace.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {MockERC721Royalty} from "../mocks/MockERC721Royalty.sol";

/**
 * @title NFTMarketplaceFuzzTest
 * @notice Fase 7: fuzz de `price` y `feeBps` con `bound()` (SWC-101 / sin overflow ni zero-price).
 * @dev Rangos: `price ∈ [1, uint128.max]`, `feeBps ∈ [0, 1000]`, royalty ∈ [0, 10_000].
 */
contract NFTMarketplaceFuzzTest is Test {
    address internal feeRecipient = makeAddr("feeRecipient");
    address internal royaltyReceiver = makeAddr("royaltyReceiver");
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");

    function setUp() public {
        vm.deal(buyer, type(uint128).max);
    }

    /**
     * @notice Precio 0 siempre revierte `ZeroPrice` (evita división/edge de venta nula).
     */
    function testFuzz_listItem_revertsZeroPrice(uint256 tokenId) public {
        tokenId = bound(tokenId, 0, 10_000);

        NFTMarketplace marketplace = new NFTMarketplace(250, feeRecipient);
        MockERC721 nft = new MockERC721("Fuzz", "FZ");
        nft.mint(seller, tokenId);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        vm.expectRevert(INFTMarketplace.ZeroPrice.selector);
        marketplace.listItem(address(nft), tokenId, 0);
        vm.stopPrank();
    }

    /**
     * @notice Fee de protocolo nunca supera el precio en el rango acotado (sin overflow).
     */
    function testFuzz_protocolFee_neverExceedsPrice(uint256 price, uint256 feeBps) public pure {
        price = bound(price, 0, type(uint128).max);
        feeBps = bound(feeBps, 0, 1000);

        uint256 protocolFee = (price * feeBps) / 10_000;
        assertLe(protocolFee, price);
    }

    /**
     * @notice List + buy sin royalty: fee + seller = price; balances coherentes.
     */
    function testFuzz_buyItem_plainNft_payoutsSumToPrice(uint256 price, uint256 feeBps) public {
        price = bound(price, 1, type(uint128).max);
        feeBps = bound(feeBps, 0, 1000);

        NFTMarketplace marketplace = new NFTMarketplace(feeBps, feeRecipient);
        MockERC721 nft = new MockERC721("Fuzz Plain", "FP");
        uint256 tokenId = 1;
        nft.mint(seller, tokenId);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nft), tokenId, price);
        vm.stopPrank();

        uint256 expectedFee = (price * feeBps) / 10_000;
        uint256 expectedSeller = price - expectedFee;

        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;
        uint256 buyerBefore = buyer.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: price}(address(nft), tokenId);

        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(feeRecipient.balance - feeBefore, expectedFee);
        assertEq(seller.balance - sellerBefore, expectedSeller);
        assertEq(buyerBefore - buyer.balance, price);
        assertEq(expectedFee + expectedSeller, price);
        assertEq(marketplace.getListing(address(nft), tokenId).seller, address(0));
    }

    /**
     * @notice List + buy con ERC-2981: fee + royalty (capeada) + seller = price.
     */
    function testFuzz_buyItem_royaltyNft_payoutsSumToPrice(uint256 price, uint256 feeBps, uint256 royaltyBps)
        public
    {
        price = bound(price, 1, type(uint128).max);
        feeBps = bound(feeBps, 0, 1000);
        royaltyBps = bound(royaltyBps, 0, 10_000);

        NFTMarketplace marketplace = new NFTMarketplace(feeBps, feeRecipient);
        MockERC721Royalty nft =
            new MockERC721Royalty("Fuzz Royalty", "FR", royaltyReceiver, uint96(royaltyBps));
        uint256 tokenId = 1;
        nft.mint(seller, tokenId);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nft), tokenId, price);
        vm.stopPrank();

        uint256 expectedFee = (price * feeBps) / 10_000;
        uint256 remaining = price - expectedFee;
        uint256 rawRoyalty = (price * royaltyBps) / 10_000;
        uint256 expectedRoyalty = rawRoyalty > remaining ? remaining : rawRoyalty;
        uint256 expectedSeller = remaining - expectedRoyalty;

        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;
        uint256 royaltyBefore = royaltyReceiver.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: price}(address(nft), tokenId);

        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(feeRecipient.balance - feeBefore, expectedFee);
        assertEq(royaltyReceiver.balance - royaltyBefore, expectedRoyalty);
        assertEq(seller.balance - sellerBefore, expectedSeller);
        assertEq(expectedFee + expectedRoyalty + expectedSeller, price);
        assertLe(expectedRoyalty, remaining);
    }

    /**
     * @notice `msg.value < price` siempre revierte `PriceNotMet`.
     */
    function testFuzz_buyItem_revertsPriceNotMet(uint256 price, uint256 paid) public {
        price = bound(price, 1, type(uint128).max);
        paid = bound(paid, 0, price - 1);

        NFTMarketplace marketplace = new NFTMarketplace(250, feeRecipient);
        MockERC721 nft = new MockERC721("Fuzz Underpay", "FU");
        uint256 tokenId = 1;
        nft.mint(seller, tokenId);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nft), tokenId, price);
        vm.stopPrank();

        vm.deal(buyer, price);
        vm.prank(buyer);
        vm.expectRevert(INFTMarketplace.PriceNotMet.selector);
        marketplace.buyItem{value: paid}(address(nft), tokenId);

        assertEq(marketplace.getListing(address(nft), tokenId).seller, seller);
        assertEq(nft.ownerOf(tokenId), address(marketplace));
    }

    /**
     * @notice Exceso de ETH se refundea al buyer; payouts siguen sumando `price`.
     */
    function testFuzz_buyItem_refundsExcess(uint256 price, uint256 excess) public {
        price = bound(price, 1, type(uint128).max / 2);
        excess = bound(excess, 1, type(uint128).max / 2);

        uint256 feeBps = 250;
        NFTMarketplace marketplace = new NFTMarketplace(feeBps, feeRecipient);
        MockERC721 nft = new MockERC721("Fuzz Excess", "FE");
        uint256 tokenId = 1;
        nft.mint(seller, tokenId);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nft), tokenId, price);
        vm.stopPrank();

        uint256 payment = price + excess;
        vm.deal(buyer, payment);

        uint256 buyerBefore = buyer.balance;
        uint256 sellerBefore = seller.balance;
        uint256 feeBefore = feeRecipient.balance;

        vm.prank(buyer);
        marketplace.buyItem{value: payment}(address(nft), tokenId);

        uint256 expectedFee = (price * feeBps) / 10_000;
        assertEq(buyerBefore - buyer.balance, price, "buyer only pays net price after refund");
        assertEq(feeRecipient.balance - feeBefore, expectedFee);
        assertEq(seller.balance - sellerBefore, price - expectedFee);
        assertEq(nft.ownerOf(tokenId), buyer);
    }
}
