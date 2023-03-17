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

contract AchievementsNFT is ERC721Enumerable, ReentrancyGuard, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  using Strings for uint256;

  mapping(uint256 => string) private _tokenURIs;
  mapping(uint256 => string) private _tokensPoints;

  event AchievementsNFTMinted(address sender, uint256 tokenId, string achievement, string points);

  constructor() ERC721("Achievements", "ACH") Ownable() {}

  function getTokenURI(
    uint256 tokenId,
    string memory achievement,
    string memory points
  ) public pure returns (string memory) {
    string[5] memory parts;
    parts[
      0
    ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 150 150"><style>.base { fill: black; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="white" /><text x="10" y="20" class="base">Achievement:</text><text x="10" y="40" class="base">';
    parts[1] = achievement;
    parts[2] = '</text><text x="10" y="60" class="base">Points: ';
    parts[3] = points;
    parts[4] = "</text></svg>";

    string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4]));

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

  /**
   * @dev See {IERC721Metadata-tokenURI}.
   */
  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    string memory _tokenURI = _tokenURIs[tokenId];
    string memory _tokenPoints = _tokensPoints[tokenId];

    return getTokenURI(tokenId, _tokenURI, _tokenPoints);
  }

  /**
   * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   */
  function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
    require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
    _tokenURIs[tokenId] = _tokenURI;
  }

  function _setTokenPoints(uint256 tokenId, string memory _tokenPoints) internal virtual {
    require(_exists(tokenId), "ERC721URIStorage: points set of nonexistent token");
    _tokensPoints[tokenId] = _tokenPoints;
  }

  /**
   * @dev See {ERC721-_burn}. This override additionally checks to see if a
   * token-specific URI was set for the token, and if so, it deletes the token URI from
   * the storage mapping.
   */
  function _burn(uint256 tokenId) internal virtual override {
    super._burn(tokenId);

    if (bytes(_tokenURIs[tokenId]).length != 0) {
      delete _tokenURIs[tokenId];
      delete _tokensPoints[tokenId];
    }
  }

  function getRawAchievement(uint256 tokenId) public view returns (string memory, string memory) {
    return (_tokenURIs[tokenId], _tokensPoints[tokenId]);
  }

  function claim(string memory achievement, string memory points) public nonReentrant {
    uint256 newItemId = _tokenIds.current();

    _safeMint(_msgSender(), newItemId);

    _setTokenURI(newItemId, achievement);
    _setTokenPoints(newItemId, points);

    _tokenIds.increment();

    emit AchievementsNFTMinted(msg.sender, newItemId, achievement, points);
  }
}
