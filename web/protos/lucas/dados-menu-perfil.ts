/** Dados do protótipo menu-perfil. A grade foi lida de https://redeglobo.globo.com/rio/programacao/ em 30/10/2026, às 11:25 (o site monta a grade no navegador, então é uma leitura pontual, não ao vivo); o programa no ar e o seguinte saem do relógio. */

/** Playlist HLS da TV Globo Rio, passada pelo designer. O token (`exp` 1793391775, 30/10/2026 ~17h20) expira: cole outro URL aqui quando parar de tocar. */
export const STREAM_URL =
  'https://live-02.edge-vivo-osa-rj.video.globo.com/j/eyJhbGciOiJSUzUxMiIsImtpZCI6IjEiLCJ0eXAiOiJKV1QifQ.eyJjb3VudHJ5X2NvZGUiOiJCUiIsImRvbWFpbiI6ImxpdmUtMDIuZWRnZS12aXZvLW9zYS1yai52aWRlby5nbG9iby5jb20iLCJleHAiOjE3OTMzOTE3NzUsImlhdCI6MTc5MzM3MDE3NSwiaXNzIjoicGxheWJhY2stYXBpLXByb2QtZ2NwIiwib3duZXIiOiJkZjMxODA4Yy00Y2RhLTRhZmEtYWRlNi1kMTlmYzQ1YWJhZDIiLCJwYXRoIjoiL2xpdmUvZihpPTIpL2dsb2JvLXJqL3BsYXlsaXN0Lm0zdTgifQ.KxynA2Tfnv3PWZkiQ-ftuHHnQkMAHZczQniPKKprkyliRahBPhkqjY8YdoSNQLDcP-qzKOdHMZsJW-al0EQZiU_U_b9d670TCDH0cqV6jDLTMpOly9a0NxqNh41jbZ0nbgfF31-Lsbhcipc-jMXTrs0O_NGQ49m_l_foIOXDalMdq6dLpcI1bg1KB5666-2JUVgs7QE9RwtLTZd-J0KRO97b6Gm1lxqIXTaKQEj0df4t10sPgjvGu7Bj2vTA_fb__lcsHgbQo_p1dkjpmIqHUiEbtr3FLOUfkURLbpS80__bd8ZVTUg3fW7DJ4cbX_-hofciX5KXGjokfthQtua6Xw/live/f(i=2)/globo-rj/playlist.m3u8?originpath=/linear/hls/pa/event/00gi0CUkS02bhg0G2B8puw/stream/e0a5b1a7-d2fa-446a-a0a7-c82cd2731b85:SCL2/variant/3af9b8dd21fe2fd756019b1b53224d04/bandwidth/6577000.m3u8'

/** Grade de 30/10/2026 (horário de Brasília): hora de início e nome de cada programa. */
const GRADE: ReadonlyArray<readonly [string, string]> = [
  ['00:20', 'Jornal da Globo'],
  ['01:10', 'Radar NFL'],
  ['01:15', 'Reapresentação - A Nobreza do Amor'],
  ['01:55', 'Reapresentação - Por Você'],
  ['02:40', 'Comédia Na Madruga I'],
  ['03:20', 'Comédia Na Madruga II'],
  ['04:00', 'Hora Um'],
  ['06:00', 'Bom Dia Rio'],
  ['08:30', 'Bom Dia Brasil'],
  ['09:30', 'Encontro Com Patrícia Poeta'],
  ['10:35', 'Mais Você'],
  ['11:45', 'RJ1'],
  ['13:00', 'Globo Esporte RJ'],
  ['13:25', 'Jornal Hoje'],
  ['14:45', 'Edição Especial - Roque Santeiro'],
  ['15:35', 'Sessão da Tarde - O Incrível Senhor Blunden'],
  ['16:50', 'Boletim RJ2'],
  ['17:05', 'Vale a Pena Ver de Novo - Avenida Brasil'],
  ['18:25', 'A Nobreza do Amor'],
  ['19:10', 'RJ2'],
  ['19:40', 'Por Você'],
  ['20:30', 'Jornal Nacional'],
  ['21:30', 'Quem Ama Cuida'],
  ['22:40', 'Globo Repórter'],
  ['23:30', 'This Is Us - 4ª temporada'],
]

/** Programa no ar e o seguinte, pelo relógio do aparelho. Antes do primeiro horário da grade, vale o último do dia (a grade vira a noite). */
export function programaAgora(agora: Date = new Date()): { noAr: string; seguinte: string } {
  const hhmm = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
  const proximo = GRADE.findIndex(([inicio]) => inicio > hhmm)
  const atual = (proximo === -1 ? GRADE.length : proximo) - 1
  return {
    noAr: GRADE[atual < 0 ? GRADE.length - 1 : atual][1],
    seguinte: GRADE[(atual + 1) % GRADE.length][1],
  }
}

/** Ícone de perfil dentro do avatar do Login (opção 11 do estudo de motion). */
export const ICONE_PERFIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAABBRJREFUeAHNWDtSG0EQbUmuAjL5BF5OYHECVkURI05gKXOGlPBLWBJ+ifAJJE6AyKHY0JnlE7CcABFBUQXya7ln3Tua/UgmoKsWzQ79edPT092zRB+MSjQnHR8fe+PxuFapVLy3t7cqz5XL5dHr62tUKpWGe3t7Ec1BMwECCB/GNjBs4PFy2CM8IUAfzgKuECD2BoD0MPRpPuoXBZYL6OzsbAtbcj4lWCqNYGSIYYTfe5muYv4rnhrmqg6ZYGdn55DmARQEQXVxcfGSpr1itiGkDOLtxU8TIL5ZoAZPT08t6B9RUUAC5hbD2qxAHMB4u1mXp6aHz8/PdReoTy4lS0tLPT5B5l2ABDQHSdwsA1gAYAcyXRPv123+ij1xenp6AADf3wOMppubm3BtbQ2YSr5Meevr64/X19c/NV9iy8S9d0XACO8WJVMAB/kw60RZnmIby5q3nECnGEFRGhg+eQK8TcnY4G3mQL5jT7tkRWeobPb0/8sKucfKFPK6SyEbcqUBmyAfpIFiD6pXX05kEpDlnb7L5RBssiE1xSevjhPzeXd3t8RjLhsa1NHRUcPWIyc1VFMxjz5lvlJ0QQ6y9v4CipsOQysA3jf5B/Wti5+BrYu9ZAJcylF7wk8Ub5cn/xy5co241ZPXCE9AKYQj3WY98urpLdHgLR4vBoRV6JwzdBnRPKAwqy51Op0R4uwqRZZctgyPiSFPMf12CZsWQ3juKZ8il6wFSOvxYkCWgLPGcK9jxnD1F8ohzaNlKQd0mQoSBIbKWIPrXRqvxIPvks0jE0O5q5dAj3jMrQUCt5umVE6jJ69RWkEGX7wog8Ec+0jxeZRuqAMwl/LaROKrYfUdNsgeW1hYqAkY38hYSdCmr2ocTYDxH2s7amnSaK4G2gB3BNxanJycjOGxB2kzfA0GYPuUvsDYlsEwASRHOBIlVVfeMISm/oEKEOeYjGCe5DXVVUYmjehMzXljS5Sx20OtwHSQWIlPBUiMdeG9DZSWTbsZszrJ0AzKSoFO74mCpzpIX/FEElPLXMf4gUdW8N6iZEz6LKtPpaOQx2EQe4gDE6sJjVHtJXSQB1YH+QP8bbJoe3t70g/h6dsdIuvAb0d03yqxRCHPbND4loDnCtv0S6+maAfpaMbq8OKq7hjsBm2qyUe70JYKbUCNVPD1sTUtmoGQGi4h33Doci5uKlPv7++fkwoyWwHNSJynXLr4OuTytLN0IMFt6kZLFKQe4RzyHLJDvpu5mFMvit1ut/ry8tIz7lbUl+YspAyS7wCJrC0UutJALiClOLDa27+C/67SfMt4lDmug17GVbqDbH+eZa/wxwb8BPa1eAbi3rv1Lh8bNClgq1TgcwxAcPYfzHL9/q8PVtJ2Jj5YMRAulPN+sPpw9Acey2wUYFz1RgAAAABJRU5ErkJggg=='
