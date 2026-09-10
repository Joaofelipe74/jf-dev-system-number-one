/**
 * Cria (ou atualiza a senha de) a conta de administrador — SEPARADO do seed
 * de dados de demonstração (correção de segurança desta auditoria).
 *
 * ANTES: `prisma/seed.ts` criava a conta de admin com uma senha
 * HARDCODED no código-fonte (`JfDev@2026`) — qualquer pessoa com acesso ao
 * repositório (inclusive um repositório público, ou um fork) conhecia a
 * senha de qualquer instalação que só tivesse rodado o seed padrão.
 *
 * AGORA: este script lê as credenciais de variáveis de ambiente
 * (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) — nunca de um valor fixo no código —
 * e faz "upsert": cria a conta se não existir, ou atualiza a senha se já
 * existir (útil para redefinir a senha de produção). Se as variáveis não
 * estiverem definidas, o script pede que sejam informadas via prompt
 * interativo no terminal (nunca inventa uma senha sozinho, nunca usa um
 * valor padrão fraco).
 *
 * Uso:
 *   ADMIN_EMAIL="voce@empresa.com" ADMIN_PASSWORD="umaSenhaForte123!" npm run db:create-admin
 * ou, de forma interativa:
 *   npm run db:create-admin
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 8;

async function promptHidden(question: string): Promise<string> {
  // Prompt simples via readline — em um terminal real, considere usar uma
  // lib de prompt com mascaramento (ex.: `@inquirer/password`) se quiser
  // esconder os caracteres digitados. Mantido sem dependências novas para
  // não aumentar a superfície de instalação deste projeto.
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function main() {
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME?.trim();

  if (!email) {
    email = (await promptHidden('E-mail do administrador: ')).toLowerCase();
  }
  if (!name) {
    name = await promptHidden('Nome do administrador (ex.: "Administrador"): ');
  }
  if (!password) {
    password = await promptHidden(`Senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres): `);
  }

  if (!email || !email.includes('@')) {
    throw new Error('E-mail inválido.');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const profile = await prisma.profile.upsert({
    where: { email },
    update: { passwordHash, name: name || undefined },
    create: { email, name: name || 'Administrador', passwordHash, role: 'admin' },
  });

  console.log('----------------------------------------------------');
  console.log(`Conta de administrador pronta: ${profile.email}`);
  console.log('A senha NÃO é exibida nem gravada em nenhum arquivo — apenas o hash foi salvo no banco.');
  console.log('----------------------------------------------------');
}

main()
  .catch((error) => {
    console.error('Falha ao criar/atualizar o administrador:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
