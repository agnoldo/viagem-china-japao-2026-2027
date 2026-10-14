import data from './full-plan.json';
import { validateContent } from '../../src/content/validate';
// Plano demonstrativo antigo: apenas fixture de regressão, nunca conteúdo da PWA.
export const fullPlanFixture = () => validateContent(structuredClone(data));
