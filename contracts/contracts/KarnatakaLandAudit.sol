// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract KarnatakaLandAudit {
    struct ParcelEvent {
        uint256 eventId;
        bytes32 parcelKey;
        bytes32 documentHash;
        string eventType;
        string recordType;
        string metadataURI;
        uint256 anchoredAt;
        address anchoredBy;
    }

    address public owner;
    uint256 public totalEvents;

    mapping(address => bool) public authorizedAnchorers;
    mapping(bytes32 => ParcelEvent[]) private parcelEvents;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AnchorerAuthorizationUpdated(address indexed anchorer, bool allowed);
    event ParcelAuditAnchored(
        uint256 indexed eventId,
        bytes32 indexed parcelKey,
        bytes32 indexed documentHash,
        string eventType,
        string recordType,
        string metadataURI,
        address anchoredBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedAnchorers[msg.sender], "Not authorized to anchor");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAnchorers[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AnchorerAuthorizationUpdated(msg.sender, true);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        address previousOwner = owner;
        owner = newOwner;
        authorizedAnchorers[newOwner] = true;
        emit OwnershipTransferred(previousOwner, newOwner);
        emit AnchorerAuthorizationUpdated(newOwner, true);
    }

    function authorizeAnchorer(address anchorer, bool allowed) external onlyOwner {
        require(anchorer != address(0), "Invalid anchorer");
        authorizedAnchorers[anchorer] = allowed;
        emit AnchorerAuthorizationUpdated(anchorer, allowed);
    }

    function anchorParcelEvent(
        bytes32 parcelKey,
        bytes32 documentHash,
        string calldata eventType,
        string calldata recordType,
        string calldata metadataURI
    ) external onlyAuthorized returns (uint256) {
        require(parcelKey != bytes32(0), "Parcel key required");

        totalEvents += 1;

        ParcelEvent memory auditEvent = ParcelEvent({
            eventId: totalEvents,
            parcelKey: parcelKey,
            documentHash: documentHash,
            eventType: eventType,
            recordType: recordType,
            metadataURI: metadataURI,
            anchoredAt: block.timestamp,
            anchoredBy: msg.sender
        });

        parcelEvents[parcelKey].push(auditEvent);

        emit ParcelAuditAnchored(
            auditEvent.eventId,
            parcelKey,
            documentHash,
            eventType,
            recordType,
            metadataURI,
            msg.sender
        );

        return auditEvent.eventId;
    }

    function getParcelEventCount(bytes32 parcelKey) external view returns (uint256) {
        return parcelEvents[parcelKey].length;
    }

    function getParcelEvents(bytes32 parcelKey) external view returns (ParcelEvent[] memory) {
        return parcelEvents[parcelKey];
    }
}

