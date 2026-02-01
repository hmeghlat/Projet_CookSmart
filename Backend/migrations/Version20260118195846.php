<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118195846 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE recipe_ingredient DROP FOREIGN KEY `FK_22D1FE1359D8A214`');
        $this->addSql('ALTER TABLE recipe_ingredient DROP FOREIGN KEY `FK_22D1FE13933FE08C`');
        $this->addSql('ALTER TABLE recipe_ingredient ADD id INT AUTO_INCREMENT NOT NULL, ADD quantity DOUBLE PRECISION DEFAULT NULL, ADD unit VARCHAR(20) DEFAULT NULL, DROP PRIMARY KEY, ADD PRIMARY KEY (id)');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT FK_22D1FE1359D8A214 FOREIGN KEY (recipe_id) REFERENCES recipe (id)');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT FK_22D1FE13933FE08C FOREIGN KEY (ingredient_id) REFERENCES ingredient (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE recipe_ingredient DROP FOREIGN KEY FK_22D1FE1359D8A214');
        $this->addSql('ALTER TABLE recipe_ingredient DROP FOREIGN KEY FK_22D1FE13933FE08C');
        $this->addSql('ALTER TABLE recipe_ingredient MODIFY id INT NOT NULL');
        $this->addSql('ALTER TABLE recipe_ingredient DROP id, DROP quantity, DROP unit, DROP PRIMARY KEY, ADD PRIMARY KEY (recipe_id, ingredient_id)');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT `FK_22D1FE1359D8A214` FOREIGN KEY (recipe_id) REFERENCES recipe (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE recipe_ingredient ADD CONSTRAINT `FK_22D1FE13933FE08C` FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) ON UPDATE NO ACTION ON DELETE CASCADE');
    }
}
