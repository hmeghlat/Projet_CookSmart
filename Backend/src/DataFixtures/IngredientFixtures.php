<?php

namespace App\DataFixtures;

use App\Entity\Ingredient;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class IngredientFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $ingredients = [
            // Légumes
            ['name' => 'Tomate', 'category' => 'Légume', 'unit' => 'kg', 'icon' => '🍅'],
            ['name' => 'Carotte', 'category' => 'Légume', 'unit' => 'kg', 'icon' => '🥕'],
            ['name' => 'Oignon', 'category' => 'Légume', 'unit' => 'kg', 'icon' => '🧅'],
            ['name' => 'Pomme de terre', 'category' => 'Légume', 'unit' => 'kg', 'icon' => '🥔'],
            ['name' => 'Salade', 'category' => 'Légume', 'unit' => 'unité', 'icon' => '🥬'],
            
            // Fruits
            ['name' => 'Pomme', 'category' => 'Fruit', 'unit' => 'kg', 'icon' => '🍎'],
            ['name' => 'Banane', 'category' => 'Fruit', 'unit' => 'unité', 'icon' => '🍌'],
            ['name' => 'Orange', 'category' => 'Fruit', 'unit' => 'kg', 'icon' => '🍊'],
            
            // Produits laitiers
            ['name' => 'Lait', 'category' => 'Produit laitier', 'unit' => 'L', 'icon' => '🥛'],
            ['name' => 'Beurre', 'category' => 'Produit laitier', 'unit' => 'g', 'icon' => '🧈'],
            ['name' => 'Fromage', 'category' => 'Produit laitier', 'unit' => 'g', 'icon' => '🧀'],
            ['name' => 'Yaourt', 'category' => 'Produit laitier', 'unit' => 'unité', 'icon' => '🥛'],
            
            // Protéines
            ['name' => 'Œuf', 'category' => 'Protéine', 'unit' => 'unité', 'icon' => '🥚'],
            ['name' => 'Poulet', 'category' => 'Viande', 'unit' => 'kg', 'icon' => '🍗'],
            ['name' => 'Bœuf', 'category' => 'Viande', 'unit' => 'kg', 'icon' => '🥩'],
            ['name' => 'Poisson', 'category' => 'Poisson', 'unit' => 'kg', 'icon' => '🐟'],
            
            // Féculents
            ['name' => 'Riz', 'category' => 'Féculent', 'unit' => 'kg', 'icon' => '🍚'],
            ['name' => 'Pâtes', 'category' => 'Féculent', 'unit' => 'kg', 'icon' => '🍝'],
            ['name' => 'Pain', 'category' => 'Boulangerie', 'unit' => 'unité', 'icon' => '🍞'],
            
            // Condiments
            ['name' => 'Huile d\'olive', 'category' => 'Condiment', 'unit' => 'L', 'icon' => '🫒'],

        ];

        foreach ($ingredients as $data) {
            $ingredient = new Ingredient();
            $ingredient->setName($data['name']);
            $ingredient->setCategory($data['category']);
            $ingredient->setUnit($data['unit']);
            $ingredient->setIcon($data['icon']);
            
            $manager->persist($ingredient);
        }

        $manager->flush();
    }
}