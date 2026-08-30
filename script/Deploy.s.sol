// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {NFTMarketplace} from "../src/NFTMarketplace.sol";
import {DemoERC721} from "../src/mocks/DemoERC721.sol";

/**
 * @title Deploy
 * @notice Deploy local de marketplace + DemoERC721 para la demo Next.js.
 * @dev `forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast`
 */
contract Deploy is Script {
    uint256 internal constant FEE_BPS = 250; // 2.5%

    function run() external {
        uint256 pk = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(pk);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);

        vm.startBroadcast(pk);

        DemoERC721 nft = new DemoERC721("Demo Market NFT", "DMNFT");
        NFTMarketplace market = new NFTMarketplace(FEE_BPS, feeRecipient);

        nft.mint(deployer, 1);
        nft.mint(deployer, 2);
        nft.mint(deployer, 3);

        vm.stopBroadcast();

        console2.log("DemoERC721", address(nft));
        console2.log("NFTMarketplace", address(market));
        console2.log("feeBps", FEE_BPS);
        console2.log("feeRecipient", feeRecipient);
        console2.log("deployer", deployer);
    }
}
