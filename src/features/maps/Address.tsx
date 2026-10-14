import { entityName } from '../../lib/labels';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, ArrowLeft } from 'lucide-react';
import { cities, hotels, places } from '../../content';
import { StatusBadge } from '../../components/shared';
import { offlineInstruction } from './links';
export function Address() {
  const { kind, id } = useParams();
  const place = kind === 'hotel' ? hotels.get(id ?? '') : places.get(id ?? '');
  const [message, setMessage] = useState('');
  if (!place)
    return (
      <>
        <h1>Endereço não encontrado</h1>
        <Link to="/cidades">Ver cidades</Link>
      </>
    );
  const city = cities.get(place.cityId);
  const text = [
    place.name.local || place.name.default,
    place.address.local || place.address.default,
  ]
    .filter(Boolean)
    .join('\n');
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error('Sem clipboard');
      setMessage('Endereço copiado.');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      setMessage(
        ok
          ? 'Endereço copiado.'
          : 'Não foi possível copiar. Selecione o texto do endereço e use Copiar.',
      );
    }
  };
  return (
    <div className="address-screen">
      <Link className="back-link" to={`/${kind === 'hotel' ? 'hotel' : 'local'}/${place.id}`}>
        <ArrowLeft size={18} />
        Voltar ao local
      </Link>
      <h1>Endereço local</h1>
      <StatusBadge status={place.status} />
      {place.status === 'example' && (
        <p className="notice">Exemplo. Confirme o local real antes de mostrar ao motorista.</p>
      )}
      <div
        className="big-address"
        lang={city?.country === 'CN' ? 'zh' : city?.country === 'JP' ? 'ja' : 'pt'}
      >
        <strong>{place.name.local || entityName(place)}</strong>
        <p>{place.address.local || place.address.default || 'Endereço ainda não preenchido.'}</p>
      </div>
      <p>
        {entityName(place)} · {city?.name.default}
      </p>
      <button className="button button-primary" disabled={!text} onClick={() => void copy()}>
        {message.startsWith('Endereço copiado') ? <Check size={20} /> : <Copy size={20} />}Copiar
        nome e endereço
      </button>
      <p className="copy-feedback" role="status" aria-label="Resultado da cópia">
        {message}
      </p>
      <details>
        <summary>Instrução offline</summary>
        <p className="preserve-lines">{offlineInstruction(place)}</p>
      </details>
    </div>
  );
}
