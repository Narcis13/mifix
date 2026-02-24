ALTER TABLE `operatiuni` ADD `tip_operatie` enum('intrare','iesire','transfer','inventar','ajustare') DEFAULT 'transfer' NOT NULL;--> statement-breakpoint
ALTER TABLE `operatiuni` ADD `stare_operatie` enum('deschisa','finalizata','anulata') DEFAULT 'deschisa' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_operatiuni_tip` ON `operatiuni` (`tip_operatie`);--> statement-breakpoint
CREATE INDEX `idx_operatiuni_stare` ON `operatiuni` (`stare_operatie`);