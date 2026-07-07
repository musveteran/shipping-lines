CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(10) NOT NULL,
	`agentCode` varchar(50) NOT NULL,
	`companyName` text NOT NULL,
	`address` text,
	`phone` varchar(50),
	`lineCode` varchar(100),
	`lineName` varchar(255),
	`rawDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_agentCode_unique` UNIQUE(`agentCode`)
);
