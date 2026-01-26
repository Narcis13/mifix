CREATE TABLE `amortizari` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mijloc_fix_id` int NOT NULL,
	`an` int NOT NULL,
	`luna` int NOT NULL,
	`valoare_lunara` decimal(15,2) NOT NULL,
	`valoare_cumulata` decimal(15,2) NOT NULL,
	`valoare_ramasa` decimal(15,2) NOT NULL,
	`valoare_inventar` decimal(15,2) NOT NULL,
	`durata_ramasa` int NOT NULL,
	`calculat` boolean DEFAULT false,
	`data_calcul` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `amortizari_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clasificari` (
	`cod` varchar(10) NOT NULL,
	`denumire` varchar(500) NOT NULL,
	`grupa` varchar(5) NOT NULL,
	`durata_normala_min` int NOT NULL,
	`durata_normala_max` int NOT NULL,
	`cota_amortizare` decimal(5,2),
	CONSTRAINT `clasificari_cod` PRIMARY KEY(`cod`)
);
--> statement-breakpoint
CREATE TABLE `conturi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`simbol` varchar(20) NOT NULL,
	`denumire` varchar(300) NOT NULL,
	`tip` enum('activ','pasiv','bifunctional') NOT NULL,
	`amortizabil` boolean DEFAULT false,
	`cont_amortizare` varchar(20),
	`activ` boolean DEFAULT true,
	CONSTRAINT `conturi_id` PRIMARY KEY(`id`),
	CONSTRAINT `conturi_simbol_unique` UNIQUE(`simbol`)
);
--> statement-breakpoint
CREATE TABLE `gestiuni` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`responsabil` varchar(200),
	`activ` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gestiuni_id` PRIMARY KEY(`id`),
	CONSTRAINT `gestiuni_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
CREATE TABLE `locuri_folosinta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gestiune_id` int NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `locuri_folosinta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mijloace_fixe` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numar_inventar` varchar(50) NOT NULL,
	`denumire` varchar(255) NOT NULL,
	`descriere` varchar(1000),
	`clasificare_cod` varchar(10) NOT NULL,
	`gestiune_id` int NOT NULL,
	`loc_folosinta_id` int,
	`sursa_finantare_id` int,
	`cont_id` int,
	`data_achizitie` date NOT NULL,
	`document_achizitie` varchar(100),
	`furnizor` varchar(200),
	`valoare_initiala` decimal(15,2) NOT NULL,
	`valoare_inventar` decimal(15,2) NOT NULL,
	`valoare_amortizata` decimal(15,2) NOT NULL DEFAULT '0.00',
	`valoare_ramasa` decimal(15,2) NOT NULL,
	`durata_normala` int NOT NULL,
	`durata_ramasa` int NOT NULL,
	`cota_amortizare_lunara` decimal(15,2) NOT NULL,
	`stare` enum('activ','casare','declasare','transfer') NOT NULL DEFAULT 'activ',
	`data_incepere_amortizare` date,
	`data_finalizare_amortizare` date,
	`data_iesire` date,
	`motiv_iesire` varchar(500),
	`observatii` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mijloace_fixe_id` PRIMARY KEY(`id`),
	CONSTRAINT `mijloace_fixe_numar_inventar_unique` UNIQUE(`numar_inventar`)
);
--> statement-breakpoint
CREATE TABLE `surse_finantare` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cod` varchar(20) NOT NULL,
	`denumire` varchar(200) NOT NULL,
	`activ` boolean DEFAULT true,
	CONSTRAINT `surse_finantare_id` PRIMARY KEY(`id`),
	CONSTRAINT `surse_finantare_cod_unique` UNIQUE(`cod`)
);
--> statement-breakpoint
CREATE TABLE `tranzactii` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mijloc_fix_id` int NOT NULL,
	`tip` enum('intrare','transfer','casare','declasare','reevaluare','modernizare','iesire') NOT NULL,
	`data_operare` date NOT NULL,
	`document_numar` varchar(100),
	`document_data` date,
	`gestiune_sursa_id` int,
	`gestiune_destinatie_id` int,
	`valoare_operatie` decimal(15,2),
	`valoare_inainte` decimal(15,2),
	`valoare_dupa` decimal(15,2),
	`descriere` varchar(500),
	`observatii` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tranzactii_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_amortizari_mijloc_fix_an_luna` ON `amortizari` (`mijloc_fix_id`,`an`,`luna`);--> statement-breakpoint
CREATE INDEX `idx_locuri_folosinta_gestiune` ON `locuri_folosinta` (`gestiune_id`);--> statement-breakpoint
CREATE INDEX `idx_mijloace_fixe_gestiune` ON `mijloace_fixe` (`gestiune_id`);--> statement-breakpoint
CREATE INDEX `idx_mijloace_fixe_clasificare` ON `mijloace_fixe` (`clasificare_cod`);--> statement-breakpoint
CREATE INDEX `idx_mijloace_fixe_stare` ON `mijloace_fixe` (`stare`);--> statement-breakpoint
CREATE INDEX `idx_mijloace_fixe_data_achizitie` ON `mijloace_fixe` (`data_achizitie`);--> statement-breakpoint
CREATE INDEX `idx_tranzactii_mijloc_fix` ON `tranzactii` (`mijloc_fix_id`);--> statement-breakpoint
CREATE INDEX `idx_tranzactii_tip` ON `tranzactii` (`tip`);--> statement-breakpoint
CREATE INDEX `idx_tranzactii_data_operare` ON `tranzactii` (`data_operare`);