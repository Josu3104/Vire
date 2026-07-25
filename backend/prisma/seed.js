const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Crear usuarios
  const user1 = await prisma.user.upsert({
    where: { email: 'diego.rivera@unitec.edu.hn' },
    update: {},
    create: {
      name: 'Diego Rivera',
      email: 'diego.rivera@unitec.edu.hn',
      passwordHash,
      role: 'member',
      affiliation: 'IEEE-48213',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Diego',
      profile: {
        create: {
          bio: 'Ingeniero apasionado por la robótica y los sistemas embebidos.',
          university: 'UNITEC',
          campus: 'Campus Tegucigalpa',
          city: 'Tegucigalpa',
          academicStatus: 'Estudiante Universitario',
          availabilityState: 'available',
        }
      }
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ieee.hn' },
    update: {},
    create: {
      name: 'Admin IEEE',
      email: 'admin@ieee.hn',
      passwordHash: adminPasswordHash,
      role: 'admin',
      affiliation: 'IEEE-ADMIN',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Admin',
      profile: {
        create: {
          bio: 'Administrador de la plataforma Vire. Conectando la ingeniería centroamericana.',
          university: 'IEEE Honduras',
          city: 'Honduras',
          academicStatus: 'Doctor/Investigador',
          availabilityState: 'unavailable',
        }
      }
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
