import type { CSSProperties, PropsWithChildren } from "react";

import { CenteredShell } from "../components/CenteredShell";
import { usePageMeta } from "../hooks/usePageMeta";

const LAST_UPDATED = "04 de agosto de 2026";
const CONTACT_EMAIL = "suporte@fleet.gustavoloper.xyz";

export function TermsPage() {
  usePageMeta(
    "Termos de Uso e Política de Privacidade",
    `Termos de Uso e Política de Privacidade do Fleet Platform. Última atualização: ${LAST_UPDATED}.`
  );
  return (
    <CenteredShell
      title="Termos de Uso e Política de Privacidade"
      subtitle={`Última atualização: ${LAST_UPDATED}`}
    >
      <div style={contentWrapperStyle}>
        <Notice />

        <Section title="Termos de Uso" isMainHeading />

        <Section title="1. Aceitação dos Termos">
          <p>
            Estes Termos de Uso regulam o acesso e a utilização do Fleet Platform ("Plataforma",
            "nós"), um aplicativo de gestão de frotas que permite cadastrar veículos, motoristas,
            abastecimentos e manutenções, além de acompanhar relatórios e indicadores de custo. Ao
            criar uma conta, você declara que leu, compreendeu e concorda integralmente com estes
            Termos e com a Política de Privacidade abaixo. Se você não concordar com qualquer parte
            deste documento, não utilize a Plataforma.
          </p>
        </Section>

        <Section title="2. Quem Pode Usar a Plataforma">
          <p>
            A Plataforma destina-se a maiores de 18 (dezoito) anos, com plena capacidade civil, que
            estejam se cadastrando em nome próprio (conta de pessoa física) ou em nome de uma
            empresa que estejam autorizados a representar (conta de empresa). Ao se cadastrar, você
            declara e garante que as informações fornecidas são verdadeiras, completas e atuais, e
            se compromete a mantê-las atualizadas.
          </p>
        </Section>

        <Section title="3. Descrição do Serviço">
          <p>A Plataforma oferece, entre outras, as seguintes funcionalidades:</p>
          <ul>
            <li>Cadastro e gestão de veículos, com controle de status e quilometragem;</li>
            <li>
              Cadastro e gestão de motoristas, incluindo dados de CNH (Carteira Nacional de
              Habilitação), fotografia de perfil e vínculo com veículos;
            </li>
            <li>
              Registro de abastecimentos, com captura opcional de localização geográfica do momento
              do abastecimento;
            </li>
            <li>Registro de manutenções preventivas e corretivas;</li>
            <li>Painéis, relatórios e exportação de dados em PDF;</li>
            <li>Funcionamento parcial offline, com sincronização automática quando a conexão for restabelecida;</li>
            <li>Planos gratuitos e pagos, com limites diferentes de veículos e motoristas.</li>
          </ul>
          <p>
            A Plataforma encontra-se em fase inicial de operação (beta), podendo passar por
            alterações, interrupções e ajustes de funcionalidades sem aviso prévio, conforme
            detalhado na Seção 10.
          </p>
        </Section>

        <Section title="4. Cadastro e Conta de Usuário">
          <p>
            Cada conta é de uso pessoal e intransferível. Você é responsável por manter a
            confidencialidade da sua senha e por todas as atividades realizadas em sua conta. Caso
            suspeite de uso não autorizado, você deve nos notificar imediatamente pelo e-mail{" "}
            {CONTACT_EMAIL} e alterar sua senha assim que possível.
          </p>
          <p>
            Contas de empresa possuem um usuário administrador, responsável por gerenciar veículos,
            motoristas e demais usuários vinculados à conta (incluindo a promoção e o rebaixamento
            de motoristas à função de Gestor). O administrador é responsável por assegurar que os
            demais usuários da conta também estejam cientes destes Termos.
          </p>
        </Section>

        <Section title="5. Planos, Preços e Pagamento">
          <p>
            A Plataforma oferece planos gratuitos com limites reduzidos de veículos e motoristas, e
            planos pagos com limites ampliados, contratados de forma recorrente. Os pagamentos são
            processados por provedor de pagamento terceirizado (atualmente, Mercado Pago); não
            armazenamos números completos de cartão de crédito em nossos servidores. O cancelamento
            de um plano pago pode ser solicitado a qualquer momento, e seus efeitos passam a valer a
            partir do próximo ciclo de cobrança, salvo disposição diversa informada no momento da
            contratação.
          </p>
        </Section>

        <Section title="6. Papéis e Permissões de Acesso">
          <p>
            A Plataforma possui diferentes papéis de acesso (Administrador, Empresa, Pessoa física,
            Motorista e Gestor), cada um com permissões específicas sobre quais dados podem ser
            visualizados e alterados. Você é responsável por atribuir esses papéis de forma
            criteriosa dentro da sua conta.
          </p>
        </Section>

        <Section title="7. Dados de Motoristas Cadastrados por Terceiros">
          <p>
            Quando uma conta de empresa ou pessoa física cadastra um motorista, é o responsável
            pela conta quem insere os dados pessoais desse motorista (nome, CPF, CNH, e-mail,
            fotografia). Ao fazê-lo, você declara possuir base legal e, quando aplicável,
            consentimento do motorista para o tratamento desses dados dentro da Plataforma, nos
            termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — "LGPD"). Cabe ao
            responsável pela conta informar ao motorista cadastrado sobre esta Política de
            Privacidade.
          </p>
        </Section>

        <Section title="8. Uso Aceitável">
          <p>Ao utilizar a Plataforma, você concorda em não:</p>
          <ul>
            <li>Inserir dados falsos, de terceiros sem autorização, ou obtidos ilicitamente;</li>
            <li>Tentar acessar contas, dados ou funcionalidades sem autorização;</li>
            <li>Realizar engenharia reversa, copiar ou explorar comercialmente o código da Plataforma sem autorização prévia por escrito;</li>
            <li>Utilizar a Plataforma para fins ilícitos ou que violem direitos de terceiros.</li>
          </ul>
        </Section>

        <Section title="9. Propriedade Intelectual">
          <p>
            O software, a marca, o layout e os demais elementos da Plataforma são de propriedade do
            responsável pela Plataforma ou de seus licenciantes, sendo protegidos pela legislação
            de propriedade intelectual aplicável. Os dados que você insere (veículos, motoristas,
            registros de abastecimento e manutenção) permanecem de sua titularidade.
          </p>
        </Section>

        <Section title="10. Disponibilidade e Suporte">
          <p>
            Por se tratar de uma plataforma em fase inicial de operação, não garantimos
            disponibilidade contínua e ininterrupta do serviço. Faremos esforços razoáveis para
            manter a Plataforma acessível e para comunicar manutenções programadas quando possível,
            mas eventuais indisponibilidades, perdas de dados decorrentes de falhas técnicas ou
            interrupções não geram, por si só, direito a indenização.
          </p>
        </Section>

        <Section title="11. Limitação de Responsabilidade">
          <p>
            A Plataforma é fornecida "no estado em que se encontra". Na máxima extensão permitida
            pela lei, não nos responsabilizamos por danos indiretos, lucros cessantes ou perda de
            dados decorrentes do uso ou da impossibilidade de uso da Plataforma, exceto nos casos de
            dolo ou culpa grave de nossa parte.
          </p>
        </Section>

        <Section title="12. Rescisão e Cancelamento">
          <p>
            Você pode encerrar sua conta a qualquer momento entrando em contato pelo e-mail{" "}
            {CONTACT_EMAIL}. Podemos suspender ou encerrar contas que violem estes Termos,
            mediante notificação prévia sempre que possível.
          </p>
        </Section>

        <Section title="13. Alterações destes Termos">
          <p>
            Podemos atualizar estes Termos periodicamente para refletir mudanças na Plataforma ou na
            legislação aplicável. Alterações relevantes serão comunicadas por e-mail ou por aviso
            dentro da Plataforma, e o uso continuado após a alteração constitui aceite dos novos
            Termos.
          </p>
        </Section>

        <Section title="14. Legislação Aplicável e Foro">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
            foro do domicílio do usuário para dirimir eventuais controvérsias, conforme facultado
            pelo Código de Defesa do Consumidor, quando aplicável.
          </p>
        </Section>

        <Section title="Política de Privacidade" isMainHeading />

        <Section title="1. Introdução">
          <p>
            Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
            os dados pessoais tratados pela Plataforma, em conformidade com a Lei Geral de Proteção
            de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </Section>

        <Section title="2. Quem é o Controlador dos Dados">
          <p>
            O controlador dos dados tratados nesta Plataforma é Gustavo Loper, pessoa física
            responsável pelo desenvolvimento e operação do Fleet Platform. Para exercer seus
            direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato pelo
            e-mail {CONTACT_EMAIL}.
          </p>
        </Section>

        <Section title="3. Dados que Coletamos">
          <p>Coletamos os seguintes dados, conforme o uso que você faz da Plataforma:</p>
          <ul>
            <li>
              <strong>Dados de cadastro:</strong> nome completo, e-mail, senha (armazenada de forma
              criptografada, nunca em texto simples), CPF ou CNPJ;
            </li>
            <li>
              <strong>Dados de motoristas:</strong> nome, CPF, número da CNH, categoria e validade
              da CNH, fotografia de perfil, e-mail de acesso (quando aplicável);
            </li>
            <li>
              <strong>Dados de veículos:</strong> placa, marca, modelo, ano, tipo de combustível,
              quilometragem;
            </li>
            <li>
              <strong>Dados de uso:</strong> registros de abastecimento e manutenção, incluindo,
              quando você autorizar, a localização geográfica aproximada no momento do
              abastecimento;
            </li>
            <li>
              <strong>Imagens:</strong> fotos de perfil e comprovantes de pagamento enviados por
              você;
            </li>
            <li>
              <strong>Dados técnicos:</strong> informações de sessão e autenticação necessárias para
              manter você conectado à Plataforma.
            </li>
          </ul>
        </Section>

        <Section title="4. Finalidade e Base Legal do Tratamento">
          <p>Tratamos seus dados pessoais para as seguintes finalidades, com as respectivas bases legais previstas no art. 7º da LGPD:</p>
          <ul>
            <li>
              <strong>Execução de contrato:</strong> viabilizar o cadastro, autenticação e
              funcionamento das funcionalidades da Plataforma que você contratou;
            </li>
            <li>
              <strong>Cumprimento de obrigação legal ou regulatória:</strong> quando aplicável, para
              atender exigências fiscais ou regulatórias relacionadas à cobrança de planos pagos;
            </li>
            <li>
              <strong>Legítimo interesse:</strong> para prevenção a fraudes, segurança da conta e
              melhoria contínua da Plataforma;
            </li>
            <li>
              <strong>Consentimento:</strong> para o envio de comunicações não essenciais, quando
              aplicável, e para a captura de geolocalização em registros de abastecimento — recurso
              opcional que pode ser recusado sem prejuízo do uso das demais funcionalidades.
            </li>
          </ul>
        </Section>

        <Section title="5. Como Protegemos seus Dados">
          <p>
            Dados sensíveis, como CPF e número de CNH, são armazenados de forma criptografada em
            nosso banco de dados. Senhas nunca são armazenadas em texto simples — utilizamos
            algoritmo de hash (argon2) reconhecido pelo mercado. O tráfego entre seu dispositivo e
            nossos servidores é protegido por HTTPS. Apesar dos esforços de segurança empregados,
            nenhum sistema é absolutamente livre de riscos, e nos comprometemos a notificar você e
            as autoridades competentes em caso de incidente de segurança que possa acarretar risco
            relevante, conforme exigido pela LGPD.
          </p>
        </Section>

        <Section title="6. Com Quem Compartilhamos seus Dados">
          <p>Compartilhamos dados pessoais estritamente com os seguintes terceiros, na medida necessária para a operação da Plataforma:</p>
          <ul>
            <li>
              <strong>Provedor de envio de e-mails</strong> (Resend), para envio de códigos de
              recuperação de senha e credenciais de acesso;
            </li>
            <li>
              <strong>Provedor de pagamentos</strong> (Mercado Pago), para processamento de
              assinaturas de planos pagos;
            </li>
            <li>
              <strong>Provedor de infraestrutura e hospedagem</strong>, para armazenamento seguro dos
              dados e disponibilização da Plataforma.
            </li>
          </ul>
          <p>
            Não vendemos seus dados pessoais a terceiros e não os compartilhamos para fins
            publicitários.
          </p>
        </Section>

        <Section title="7. Retenção e Exclusão de Dados">
          <p>
            Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta
            Política, ou pelo prazo exigido por lei. Ao solicitar o encerramento da sua conta, seus
            dados pessoais serão excluídos ou anonimizados em prazo razoável, ressalvadas as
            hipóteses de guarda obrigatória por obrigação legal ou regulatória (por exemplo, dados
            fiscais de cobrança).
          </p>
        </Section>

        <Section title="8. Seus Direitos como Titular de Dados">
          <p>Nos termos do art. 18 da LGPD, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
            <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço;</li>
            <li>Revogar o consentimento dado, quando aplicável;</li>
            <li>Solicitar informações sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
            {CONTACT_EMAIL}. Responderemos dentro de prazo razoável.
          </p>
        </Section>

        <Section title="9. Armazenamento Local no Dispositivo">
          <p>
            Para viabilizar o funcionamento offline e manter você conectado, a Plataforma armazena
            localmente no seu navegador (via localStorage/sessionStorage e banco de dados local do
            dispositivo) seus tokens de sessão e dados temporários de registros criados sem conexão
            à internet, até que sejam sincronizados com nossos servidores. Esses dados ficam
            restritos ao seu dispositivo e navegador.
          </p>
        </Section>

        <Section title="10. Dados de Motoristas Cadastrados por Terceiros">
          <p>
            Quando seus dados como motorista são inseridos por um administrador de conta de empresa
            ou pessoa física (e não diretamente por você), tratamos esses dados com base na relação
            entre você e o responsável pela conta que o cadastrou. Você pode exercer os direitos
            listados na Seção 8 entrando em contato conosco ou com o responsável pela conta que
            realizou o seu cadastro.
          </p>
        </Section>

        <Section title="11. Menores de Idade">
          <p>
            A Plataforma não se destina a menores de 18 anos, e não coletamos intencionalmente dados
            de menores. Caso identifiquemos cadastro feito por menor de idade, tomaremos medidas
            para encerrar a conta e excluir os dados correspondentes.
          </p>
        </Section>

        <Section title="12. Alterações desta Política">
          <p>
            Esta Política pode ser atualizada periodicamente. Alterações relevantes serão
            comunicadas por e-mail ou por aviso dentro da Plataforma antes de entrarem em vigor.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Dúvidas, solicitações relacionadas a dados pessoais ou qualquer outra questão sobre
            estes Termos de Uso e Política de Privacidade podem ser enviadas para{" "}
            {CONTACT_EMAIL}.
          </p>
        </Section>
      </div>
    </CenteredShell>
  );
}

function Notice() {
  return (
    <div style={noticeStyle}>
      <strong>Aviso:</strong> este documento foi elaborado como uma minuta inicial abrangente para
      a fase de testes da Plataforma. Ele ainda não passou por revisão de um advogado licenciado e
      pode precisar de ajustes antes de um lançamento em maior escala, especialmente quanto aos
      dados sensíveis tratados (CPF, CNH e geolocalização).
    </div>
  );
}

function Section({
  title,
  isMainHeading,
  children
}: PropsWithChildren<{ title: string; isMainHeading?: boolean }>) {
  return (
    <section style={sectionStyle}>
      {isMainHeading ? <h2 style={mainHeadingStyle}>{title}</h2> : <h3 style={headingStyle}>{title}</h3>}
      {children}
    </section>
  );
}

const contentWrapperStyle: CSSProperties = {
  maxWidth: "760px",
  margin: "0 auto",
  color: "#e2e8f0",
  lineHeight: 1.65
};

const noticeStyle: CSSProperties = {
  padding: "1rem 1.2rem",
  borderRadius: "0.9rem",
  background: "rgba(251, 191, 36, 0.1)",
  border: "1px solid rgba(251, 191, 36, 0.28)",
  color: "#fbbf24",
  marginBottom: "2rem",
  fontSize: "0.92rem"
};

const sectionStyle: CSSProperties = {
  marginBottom: "1.75rem"
};

const mainHeadingStyle: CSSProperties = {
  fontSize: "1.6rem",
  marginTop: "2.5rem",
  marginBottom: "1rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  color: "#fbbf24"
};

const headingStyle: CSSProperties = {
  fontSize: "1.05rem",
  marginBottom: "0.5rem",
  color: "#f8fafc"
};
