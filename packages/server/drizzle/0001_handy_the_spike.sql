CREATE TABLE `tipuri_document` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(100) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `tipuri_document_id` PRIMARY KEY(`id`),
	CONSTRAINT `tipuri_document_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`activ` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `amortizari` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `gestiuni` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `gestiuni` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tranzactii` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD `tip_document_id` int;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD `e_amortizabil` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD `loc_folosinta_sursa_id` int;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD `loc_folosinta_destinatie_id` int;--> statement-breakpoint
ALTER TABLE `amortizari` ADD CONSTRAINT `uniq_amortizari_mijloc_fix_an_luna` UNIQUE(`mijloc_fix_id`,`an`,`luna`);