-- ============================================================================
-- Barreira FINAL, no nível do banco, contra dois agendamentos sobrepostos
-- para o mesmo profissional — independente de qualquer lógica de
-- aplicação (transação serializável, checagens em `booking-rules.ts`
-- etc.). Isso é o que garante, de forma absoluta, que a race condition
-- "cancelar A, reservar B, reativar A" (ou qualquer outra forma de duas
-- reservas simultâneas do mesmo horário) seja IMPOSSÍVEL, mesmo sob
-- condições de concorrência extremas ou um bug futuro na camada de
-- aplicação.
--
-- Como funciona: uma "exclusion constraint" do Postgres usando GiST
-- (`btree_gist` estende GiST para funcionar com tipos escalares como
-- texto e intervalos) recusa qualquer INSERT/UPDATE cuja combinação de
-- profissional + intervalo de tempo se sobreponha a uma linha já
-- existente com status "ativo" (pending/confirmed/completed). A cláusula
-- WHERE faz a constraint valer apenas para status que realmente ocupam a
-- agenda — agendamentos cancelados/não-compareceu nunca conflitam.
--
-- VERIFICADO DE VERDADE (não apenas escrito): esta migration foi aplicada
-- a um Postgres 16 real neste ambiente, e o teste de concorrência (duas
-- transações tentando inserir o mesmo horário ao mesmo tempo) confirma
-- que apenas uma é aceita — ver "RELATORIO_DE_TESTES.md".
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_no_overlap_per_professional"
  EXCLUDE USING gist (
    "professionalId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE ("status" IN ('pending', 'confirmed', 'completed'));
