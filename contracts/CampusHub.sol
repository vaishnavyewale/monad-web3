// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract CampusHub {
    address public owner;

    struct CampusEvent {
        uint256 id;
        string title;
        uint256 date;
        uint256 maxSeats;
        uint256 registeredCount;
    }

    mapping(uint256 => CampusEvent) public events;
    mapping(uint256 => mapping(address => bool)) public registered;

    uint256 public eventCount;

    event EventCreated(
        uint256 indexed eventId,
        string title,
        uint256 date,
        uint256 maxSeats
    );

    event Registered(
        uint256 indexed eventId,
        address indexed student
    );

    constructor() {
        owner = msg.sender;

        _createEvent(
            "AI & Machine Learning Workshop",
            1791590400,
            50
        );

        _createEvent(
            "Web3 & Blockchain Bootcamp",
            1792022400,
            40
        );

        _createEvent(
            "DevOps Deployment Lab",
            1792454400,
            35
        );
    }

    function _createEvent(
        string memory title,
        uint256 date,
        uint256 maxSeats
    ) internal {
        eventCount++;

        events[eventCount] = CampusEvent({
            id: eventCount,
            title: title,
            date: date,
            maxSeats: maxSeats,
            registeredCount: 0
        });

        emit EventCreated(
            eventCount,
            title,
            date,
            maxSeats
        );
    }

    function register(uint256 eventId) external {
        require(eventId > 0 && eventId <= eventCount, "Event does not exist");

        CampusEvent storage campusEvent = events[eventId];

        require(
            campusEvent.registeredCount < campusEvent.maxSeats,
            "Event is full"
        );

        require(
            !registered[eventId][msg.sender],
            "Already registered"
        );

        registered[eventId][msg.sender] = true;
        campusEvent.registeredCount++;

        emit Registered(eventId, msg.sender);
    }

    function isRegistered(
        uint256 eventId,
        address student
    ) external view returns (bool) {
        return registered[eventId][student];
    }

    function getEvent(
        uint256 eventId
    )
        external
        view
        returns (
            uint256 id,
            string memory title,
            uint256 date,
            uint256 maxSeats,
            uint256 registeredCount
        )
    {
        CampusEvent memory campusEvent = events[eventId];

        return (
            campusEvent.id,
            campusEvent.title,
            campusEvent.date,
            campusEvent.maxSeats,
            campusEvent.registeredCount
        );
    }
}