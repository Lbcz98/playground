# Tokens, imports e ícones

Os exemplos do Storybook mostram `from 'screenflow-studio'`: troque pelos caminhos abaixo.

```tsx
import { Stack, Text } from '@/primitives'
import { MainMenu } from '@/ui-kit/MainMenu'      // um arquivo por componente
import { Screen } from '@/ui-kit/Screen'
```

- Use só componentes do kit e props documentadas no Storybook. Estilo é o **nome de um token** (`gap="sm"`, `background="primary"`), sem hex, px, rem, `style`, `className` nem elementos HTML (`div`, `span`).
- Ícones vêm dentro de cada componente (não há componente de ícone genérico); não importe `.svg`.
- A raiz do `<Screen>` não pinta fundo nem tem margem: o quadro cuida disso.
- Um único foco por tela (nível 0 não tem). Vários componentes nascem focados: confira `docs-show`.
