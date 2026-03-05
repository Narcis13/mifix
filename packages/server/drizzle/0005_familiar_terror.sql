CREATE TABLE `dispozitive_medicale` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mijloc_fix_id` int NOT NULL,
	`clasa_risc` enum('I','IIa','IIb','III') NOT NULL,
	`producator` varchar(300) NOT NULL,
	`tara_producator` varchar(100),
	`reprezentant_autorizat_ue` varchar(300),
	`importator` varchar(300),
	`model` varchar(200),
	`referinta_catalog` varchar(100),
	`udi_di` varchar(100),
	`udi_pi` varchar(200),
	`numar_serie` varchar(100),
	`numar_lot` varchar(100),
	`data_fabricatie` date,
	`data_expirare` date,
	`numar_eudamed` varchar(100),
	`numar_inregistrare_anmdm` varchar(100),
	`data_inregistrare_anmdm` date,
	`marca_ce` boolean DEFAULT true,
	`organism_notificat` varchar(100),
	`numar_certificat_ce` varchar(100),
	`data_expira_certificat_ce` date,
	`destinatie_utilizare` varchar(500),
	`conditii_stocare` varchar(300),
	`interval_mentenanta_luni` int,
	`data_mentenanta_urmatoare` date,
	`stare_dm` enum('activ','mentenanta','retras','carantinat','defect','arhivat') NOT NULL DEFAULT 'activ',
	`observatii` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispozitive_medicale_id` PRIMARY KEY(`id`),
	CONSTRAINT `dispozitive_medicale_mijloc_fix_id_unique` UNIQUE(`mijloc_fix_id`)
);
--> statement-breakpoint
CREATE TABLE `incidente_adverse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dispozitiv_medical_id` int NOT NULL,
	`data_incident` date NOT NULL,
	`data_sesizare` date,
	`tip_incident` enum('incident_sever','incident_nonsever','near_miss','reclamatie_user','malfunctionare','alerta_teren') NOT NULL,
	`descriere` varchar(2000) NOT NULL,
	`raportat_anmdm` boolean DEFAULT false,
	`numar_raport_anmdm` varchar(100),
	`data_raport_anmdm` date,
	`actiune_corectiva` varchar(2000),
	`data_inchidere` date,
	`stare_incident` enum('deschis','investigatie','raportat','inchis') NOT NULL DEFAULT 'deschis',
	`observatii` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidente_adverse_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mentenanta_dispozitive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dispozitiv_medical_id` int NOT NULL,
	`tip_mentenanta` enum('preventiva','corectiva','calibrare','verificare','actualizare') NOT NULL,
	`data_planificata` date,
	`data_efectuata` date,
	`efectuat_de` varchar(200),
	`autorizat_de` varchar(200),
	`descriere` varchar(1000),
	`rezultat_mentenanta` enum('ok','conditionat','defect','retras') NOT NULL,
	`certificat_calibrare_numar` varchar(100),
	`data_expira_calibrare` date,
	`numar_raport` varchar(100),
	`observatii` varchar(1000),
	`data_mentenanta_urmatoare` date,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mentenanta_dispozitive_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_mijloc_fix` ON `dispozitive_medicale` (`mijloc_fix_id`);--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_clasa_risc` ON `dispozitive_medicale` (`clasa_risc`);--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_stare` ON `dispozitive_medicale` (`stare_dm`);--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_data_expirare` ON `dispozitive_medicale` (`data_expirare`);--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_data_mentenanta` ON `dispozitive_medicale` (`data_mentenanta_urmatoare`);--> statement-breakpoint
CREATE INDEX `idx_dispozitive_medicale_data_expira_ce` ON `dispozitive_medicale` (`data_expira_certificat_ce`);--> statement-breakpoint
CREATE INDEX `idx_incidente_dispozitiv` ON `incidente_adverse` (`dispozitiv_medical_id`);--> statement-breakpoint
CREATE INDEX `idx_incidente_data` ON `incidente_adverse` (`data_incident`);--> statement-breakpoint
CREATE INDEX `idx_incidente_stare` ON `incidente_adverse` (`stare_incident`);--> statement-breakpoint
CREATE INDEX `idx_incidente_tip` ON `incidente_adverse` (`tip_incident`);--> statement-breakpoint
CREATE INDEX `idx_incidente_raportat_anmdm` ON `incidente_adverse` (`raportat_anmdm`);--> statement-breakpoint
CREATE INDEX `idx_mentenanta_dispozitiv` ON `mentenanta_dispozitive` (`dispozitiv_medical_id`);--> statement-breakpoint
CREATE INDEX `idx_mentenanta_data_efectuata` ON `mentenanta_dispozitive` (`data_efectuata`);--> statement-breakpoint
CREATE INDEX `idx_mentenanta_data_urmatoare` ON `mentenanta_dispozitive` (`data_mentenanta_urmatoare`);--> statement-breakpoint
CREATE INDEX `idx_mentenanta_tip` ON `mentenanta_dispozitive` (`tip_mentenanta`);