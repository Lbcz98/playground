import type { ReactNode } from 'react'
import { FocusRing } from '@/primitives'
import { AVATAR_LOGADO } from '../dados-avatar-logado'
import { LOGO_GLOBOPLAY, QR_LOGO } from '../dados-login'
import { estiloUnico } from './estiloUnico'

// A foto e a marca ficam neste componente, dentro do protótipo: o kit não tem um slot para as duas juntas.
estiloUnico(
  'marcas-sso',
  '.sso-marcas { position: relative; width: var(--dimension-size-semantic-avatar); height: var(--dimension-size-semantic-avatar); }' +
    '.sso-foto { display: block; width: var(--dimension-size-semantic-avatar); height: var(--dimension-size-semantic-avatar); border-radius: var(--dimension-radius-semantic-pill); object-fit: cover; }' +
    '.sso-logo { position: absolute; left: var(--dimension-spacing-core-md); bottom: 0; width: var(--dimension-size-semantic-icon-xl); height: var(--dimension-size-semantic-icon-xl); }' +
    '.bv-retrato { display: flex; flex-direction: column; align-items: center; }' +
    '.bv-logo { display: block; width: var(--dimension-size-semantic-content-card-qr-logo); height: auto; }' +
    '.bv-foto { position: relative; display: block; width: var(--dimension-size-semantic-content-card-qr-logo); height: var(--dimension-size-semantic-content-card-qr-logo); margin-top: var(--dimension-spacing-core-lg); border-radius: var(--dimension-radius-semantic-pill); }' +
    '.bv-foto-img { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }',
)

/**
 * Foto do perfil com a marca da Globoplay por cima, no canto superior esquerdo do botão de SSO.
 * @proposal
 * why: o kit não tem um botão de trilha com a foto do perfil e a marca da Globoplay juntas no canto
 * description: a foto circular e a marca da Globoplay sobre o canto inferior direito, no topo do botão de SSO
 * proposedApi:
 *   photoSrc: "string"
 *   logoSrc: "string"
 */
export function MarcasSso({ photoSrc = AVATAR_LOGADO, logoSrc = LOGO_GLOBOPLAY }: { photoSrc?: string; logoSrc?: string }): ReactNode {
  return (
    <span className="sso-marcas">
      <img className="sso-foto" src={photoSrc} alt="" />
      <img className="sso-logo" src={logoSrc} alt="" />
    </span>
  )
}

/**
 * Logo da Conta Globo e a foto do perfil no cartão de boas-vindas.
 * @proposal
 * why: o kit não tem o par logo e retrato circular que o cartão de boas-vindas do staging mostra
 * description: o logo da Conta Globo acima da foto circular, com o anel de foco do kit em volta da foto
 * proposedApi:
 *   logoSrc: "string"
 *   photoSrc: "string"
 */
export function RetratoBoasVindas({ logoSrc = QR_LOGO, photoSrc = AVATAR_LOGADO }: { logoSrc?: string; photoSrc?: string }): ReactNode {
  return (
    <span className="bv-retrato">
      <img className="bv-logo" src={logoSrc} alt="" />
      <span className="bv-foto">
        <img className="bv-foto-img" src={photoSrc} alt="" />
        <FocusRing shape="pill" fill={false} />
      </span>
    </span>
  )
}
