// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import {Base64} from "./libs/Base64.sol";

contract AchievementsNFT is ERC721URIStorage, ReentrancyGuard, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  event AchievementsNFTMinted(address sender, uint256 tokenId, string achievement);

  constructor() ERC721("Achievements", "ACH") Ownable() {}

  function getTokenURI(uint256 tokenId, string memory achievement) public pure returns (string memory) {
    string[3] memory parts;
    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: black; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="white" /><text x="10" y="20" class="base">';

    parts[1] = achievement;

    parts[2] = "</text></svg>";

    string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2]));

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "Achievement #',
            Strings.toString(tokenId),
            '", "description": "Achievement", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(output)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));

    return output;
  }

  function claim(string memory achievement) public nonReentrant {
    uint256 newItemId = _tokenIds.current();

    _safeMint(_msgSender(), newItemId);

    string memory tokenUri = getTokenURI(newItemId, achievement);

    console.log(tokenUri, "<< uri");

    _setTokenURI(newItemId, tokenUri);

    _tokenIds.increment();

    emit AchievementsNFTMinted(msg.sender, newItemId, achievement);
  }
}
