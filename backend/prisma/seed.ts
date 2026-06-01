import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USERS: { email: string; password: string; role: Role }[] = [
  { email: 'admin@example.com',   password: 'Admin1234!',   role: Role.ADMIN },
  { email: 'manager@example.com', password: 'Manager1234!', role: Role.MANAGER },
  { email: 'alice@example.com',   password: 'Member1234!',  role: Role.MEMBER },
  { email: 'bob@example.com',     password: 'Member1234!',  role: Role.MEMBER },
  { email: 'charlie@example.com', password: 'Member1234!',  role: Role.MEMBER },
];

async function seed() {
  console.log('Seeding users...');
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { email: u.email, password: hash, role: u.role },
    });
    console.log(`  ${u.role.padEnd(8)} ${u.email}  (password: ${u.password})`);
  }
  console.log('Seeding complete.');
}

seed()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
