import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { content } from '../content';
import { PageHeading, Section, StatusBadge } from '../components/shared';
import type { Status } from '../content/schema';
import { checkOffline, checkForUpdate } from '../lib/pwa';
import { formatDate } from '../lib/time';
import { readPreference } from '../lib/preferences';
export function More() {
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const last = readPreference('last-day');
  const verify = async () => {
    setBusy(true);
    try {
      const report = await checkOffline();
      setResult(
        report.ready
          ? `Pronto para teste em modo avião: ${report.assets} arquivos verificados e cópia de recuperação disponível. Cache ${report.version}.`
          : `Cache incompleto: ${report.missing} arquivos ausentes. Reconecte. Se a atualização não reparar, reabra a publicação com rede e reinstale o offline antes de viajar.`,
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Não foi possível verificar.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        title="Mais"
        description="Prepare o aplicativo para funcionar longe da internet."
      />
      <Section title="Disponibilidade offline">
        <div className="offline-guide">
          <ShieldCheck size={32} aria-hidden="true" />
          <div>
            <h3>Conteúdo registrado no seu iPhone</h3>
            <p>
              Após a instalação do cache, China e Japão ficam juntos no dispositivo. A indicação de
              rede, sozinha, não garante que o cache está completo.
            </p>
            <div className="button-row">
              <button
                className="button button-primary"
                disabled={busy}
                onClick={() => void verify()}
              >
                <Download size={18} />
                {busy ? 'Verificando…' : 'Verificar offline'}
              </button>
              <button
                className="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void checkForUpdate()
                    .then(setResult)
                    .finally(() => setBusy(false));
                }}
              >
                <RefreshCw size={18} />
                Verificar atualização
              </button>
            </div>
            <p
              className="operation-result"
              role="status"
              aria-label="Resultado da verificação offline"
            >
              {result}
            </p>
          </div>
        </div>
        <ol className="instruction-list">
          <li>
            Abra este endereço no Safari com internet. Aguarde o preparo e toque em “Verificar
            offline”.
          </li>
          <li>
            No Safari: Compartilhar → Adicionar à Tela de Início → Adicionar. Abra o ícone e
            verifique offline novamente.
          </li>
          <li>
            Ative modo avião e desligue o Wi-Fi. Feche completamente o aplicativo e reabra pelo
            ícone.
          </li>
          <li>
            Visite todos os dias, cidades e endereços. Repita nos quatro iPhones antes de partir.
          </li>
          <li>
            Se houver atualização, instale com rede estável e repita a verificação. O Safari pode
            remover dados locais por falta de espaço.
          </li>
        </ol>
      </Section>
      <Section title="Conteúdo e versão">
        <dl className="info-list">
          <div>
            <dt>Conteúdo atualizado em</dt>
            <dd>{content.trip.contentVersion}</dd>
          </div>
          <div>
            <dt>Período</dt>
            <dd>
              {formatDate(content.trip.startDate, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              a{' '}
              {formatDate(content.trip.endDate, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt>Disponível no pacote</dt>
            <dd>{content.days.length} dias · China e Japão</dd>
          </div>
        </dl>
        {content.trip.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        <p>
          Os dados de exemplo não são reservas. Horários são locais; cada voo mostra o fuso da
          partida e da chegada.
        </p>
        {last && content.days.some((d) => d.date === last) && (
          <Link className="button" to={`/hoje/${last}`}>
            Abrir último dia consultado
          </Link>
        )}
      </Section>
      <Section title="Legenda do roteiro">
        <div className="legend">
          {(
            ['confirmed', 'planned', 'optional', 'example', 'undecided', 'cancelled'] as Status[]
          ).map((status) => (
            <div key={status}>
              <StatusBadge status={status} />
              <p>
                {
                  {
                    confirmed: 'Informação explicitamente confirmada pelo mantenedor.',
                    planned: 'Parte do roteiro-base, sujeita a ajustes.',
                    optional: 'Uma possibilidade; não é compromisso.',
                    example: 'Dado demonstrativo. Substituir antes de usar.',
                    undecided: 'Escolha ou informação ainda em aberto.',
                    cancelled: 'Item cancelado, preservado para referência.',
                  }[status]
                }
              </p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Informações úteis">
        {content.trip.usefulInfo.map((info) => (
          <details key={info.title}>
            <summary>{info.title}</summary>
            <p>{info.body}</p>
          </details>
        ))}
      </Section>
      <Section title="Antes da viagem">
        <ul className="instruction-list">
          <li>Substituir os exemplos; confirmar hotéis, voos e trens.</li>
          <li>Preencher endereços locais e testar mapas em cada aparelho.</li>
          <li>Confirmar as alternativas em aberto e a hospedagem de neve.</li>
          <li>Guardar documentos privados no Apple Notes ou iCloud Drive, com cópias offline.</li>
          <li>
            Confirmar endereço estático reserva. Cada endereço precisa de sua própria instalação e
            cache.
          </li>
        </ul>
      </Section>
    </>
  );
}
