/**
 * Envio de notificações para o cliente (código de acesso da Área do
 * Cliente). Interface pensada para ser trocada por um provedor real sem
 * alterar quem a chama.
 *
 * ESTADO ATUAL, DECLARADO SEM AMBIGUIDADE (nada aqui finge enviar SMS/e-mail
 * de verdade): este projeto não tem — e não inventa — credenciais de um
 * provedor de SMS/e-mail. O `ConsoleNotificationSender` abaixo é o único
 * remetente implementado: ele registra o código nos LOGS DO SERVIDOR
 * (nunca na resposta HTTP, nunca na tela do cliente) e é isso. Isso ainda é
 * uma melhoria de segurança real em relação ao comportamento anterior (que
 * vazava o cadastro completo de qualquer cliente por busca parcial de
 * telefone/e-mail): agora ninguém recebe dado nenhum sem antes provar
 * controle do contato através de um canal fora desta aplicação.
 *
 * Para produção, implemente `NotificationSender` com um provedor real
 * (ex.: Resend/SendGrid para e-mail, Twilio/Zenvia para SMS) e troque a
 * instância exportada abaixo — usando variáveis de ambiente para as
 * credenciais (nunca hardcoded). Isso está documentado como pendência
 * externa explícita no README.
 */

export interface NotificationTarget {
  phone: string | null;
  email: string | null;
}

export interface NotificationSender {
  sendAccessCode(target: NotificationTarget, code: string): Promise<void>;
}

class ConsoleNotificationSender implements NotificationSender {
  async sendAccessCode(target: NotificationTarget, code: string): Promise<void> {
    const destination = target.email ?? target.phone ?? 'contato desconhecido';
    // eslint-disable-next-line no-console
    console.log(
      `[jf-dev][área-do-cliente] Código de acesso "${code}" gerado para ${destination}. ` +
        `Nenhum provedor real de SMS/e-mail está configurado neste ambiente — ` +
        `configure um em produção (ver seção "Pendências externas" do README).`
    );
  }
}

export const notificationSender: NotificationSender = new ConsoleNotificationSender();
