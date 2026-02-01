<?php

namespace App\Tests\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiSecurityTest extends WebTestCase
{
    private static function resetDatabaseSchema(): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = static::getContainer()->get('doctrine')->getManager();

        $metadata = $entityManager->getMetadataFactory()->getAllMetadata();
        if ($metadata !== []) {
            $schemaTool = new SchemaTool($entityManager);
            $schemaTool->dropSchema($metadata);
            $schemaTool->createSchema($metadata);
        }

        $entityManager->clear();
    }

    public static function provideProtectedRoutes(): iterable
    {
        yield 'matching' => ['GET', '/api/matching'];
        yield 'recipes_list' => ['GET', '/api/recipes'];
        yield 'inventories_list' => ['GET', '/api/inventories'];
    }

    #[DataProvider('provideProtectedRoutes')]
    public function testProtectedRoutesRequireAuthentication(string $method, string $path): void
    {
        $client = static::createClient();
        $client->request($method, $path, [], [], [
            'HTTP_ACCEPT' => 'application/json',
        ]);

        $this->assertResponseStatusCodeSame(401);

        $contentType = (string) $client->getResponse()->headers->get('Content-Type');
        $this->assertStringContainsString('application/json', $contentType);
    }

    public function testRegisterIsPublic(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], json_encode([]));

        // Le point important: pas un 401 (JWT) / 403 (access_control)
        $this->assertNotSame(401, $client->getResponse()->getStatusCode());
        $this->assertNotSame(403, $client->getResponse()->getStatusCode());

        // Avec un payload vide, ton controller répond 400 "Données manquantes"
        $this->assertResponseStatusCodeSame(400);
    }

    public function testLoginCheckIsPublicAndReturnsTokenWithValidCredentials(): void
    {
        $email = 'test.user@example.com';
        $plainPassword = 'password123';

        $client = static::createClient();
        self::resetDatabaseSchema();

        /** @var EntityManagerInterface $entityManager */
        $entityManager = static::getContainer()->get('doctrine')->getManager();
        /** @var UserPasswordHasherInterface $passwordHasher */
        $passwordHasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setPseudo('testuser');
        $user->setCreatedAt(new \DateTimeImmutable());
        $user->setRoles(['ROLE_USER']);
        $user->setPassword($passwordHasher->hashPassword($user, $plainPassword));

        $entityManager->persist($user);
        $entityManager->flush();

        $client->request('POST', '/api/login_check', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], json_encode([
            'email' => $email,
            'password' => $plainPassword,
        ]));

        $this->assertResponseIsSuccessful();

        $data = json_decode((string) $client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
    }

    
}