/** Nome desconhecido permanece null nos dados; o rótulo é apenas uma indicação de pendência. */
export function entityName(entity: { name: { default: string | null }; type?: string }): string {
  return (
    entity.name.default ??
    (entity.type === 'resort' ? 'Resort · nome a registrar' : 'Hospedagem · nome a registrar')
  );
}
