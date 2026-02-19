CREATE TABLE `operatiuni` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numar_operatie` int NOT NULL,
	`an` int NOT NULL,
	`data_operare` date NOT NULL,
	`tip_document_id` int,
	`numar_document` varchar(100),
	`data_document` date,
	`descriere` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `operatiuni_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_operatiuni_an_numar` UNIQUE(`an`,`numar_operatie`)
);
--> statement-breakpoint
CREATE TABLE `provenienta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `provenienta_id` PRIMARY KEY(`id`),
	CONSTRAINT `provenienta_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
CREATE TABLE `tipuri_stoc` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `tipuri_stoc_id` PRIMARY KEY(`id`),
	CONSTRAINT `tipuri_stoc_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
CREATE TABLE `unitati_masura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `unitati_masura_id` PRIMARY KEY(`id`),
	CONSTRAINT `unitati_masura_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
ALTER TABLE `conturi` ADD `titlu` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD `provenienta_id` int;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD `tip_stoc_id` int;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD `unitate_masura_id` int;--> statement-breakpoint
ALTER TABLE `surse_finantare` ADD `capitol` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `surse_finantare` ADD `cod_capitol_1` int;--> statement-breakpoint
ALTER TABLE `surse_finantare` ADD `cod_capitol_2` int;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD `operatiune_id` int;--> statement-breakpoint
CREATE INDEX `idx_operatiuni_data` ON `operatiuni` (`data_operare`);